import { supabase } from "@/integrations/supabase/client";
import type {
  FrameworkRef,
  FrameworkVersion,
  FrameworkVersionCreateInput,
  FrameworkVersionUpdateInput,
  ListFrameworkVersionsParams,
  ListFrameworkVersionsResult,
} from "./types";

function appSchema() {
  return (supabase as unknown as {
    schema: (name: string) => { from: (table: string) => any };
  }).schema("app");
}

function versionsTable() {
  return appSchema().from("framework_versions");
}

function frameworksTable() {
  return appSchema().from("frameworks");
}

const SELECT_COLS =
  "id, framework_id, version_number, version_name, description, status, published_at, effective_from, effective_to, is_current, created_at, updated_at, framework:frameworks!fk_framework_versions_framework(id, code, name)";

function escapeIlike(term: string): string {
  return term.replace(/[%,]/g, (m: string) => `\\${m}`);
}

export async function listActiveFrameworks(): Promise<FrameworkRef[]> {
  const { data, error } = await frameworksTable()
    .select("id, code, name")
    .eq("is_active", true)
    .order("code", { ascending: true })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as FrameworkRef[];
}

export async function listFrameworkVersions(
  params: ListFrameworkVersionsParams,
): Promise<ListFrameworkVersionsResult> {
  const { search, sortField, sortDirection, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const ascending = sortDirection === "asc";

  let query = versionsTable().select(SELECT_COLS, { count: "exact" });

  const term = search?.trim();
  if (term) {
    const escaped = escapeIlike(term);
    // Find framework ids matching the term to include framework code/name in the search.
    const { data: fwMatches, error: fwErr } = await frameworksTable()
      .select("id")
      .or(`name.ilike.%${escaped}%,code.ilike.%${escaped}%`)
      .limit(1000);
    if (fwErr) throw fwErr;
    const ids = (fwMatches ?? []).map((r: { id: string }) => r.id);
    const parts = [
      `version_number.ilike.%${escaped}%`,
      `version_name.ilike.%${escaped}%`,
    ];
    if (ids.length > 0) {
      parts.push(`framework_id.in.(${ids.join(",")})`);
    }
    query = query.or(parts.join(","));
  }

  if (sortField === "framework") {
    query = query.order("code", { ascending, foreignTable: "frameworks" });
  } else {
    query = query.order(sortField, { ascending, nullsFirst: !ascending });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as FrameworkVersion[], total: count ?? 0 };
}

export async function createFrameworkVersion(
  input: FrameworkVersionCreateInput,
): Promise<FrameworkVersion> {
  const payload = {
    framework_id: input.framework_id,
    version_number: input.version_number.trim(),
    version_name: input.version_name.trim(),
    description: input.description,
    effective_from: input.effective_from,
    effective_to: input.effective_to,
    is_current: false,
    published_at: null,
  };
  const { data, error } = await versionsTable()
    .insert(payload)
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data as FrameworkVersion;
}

export async function updateFrameworkVersion(
  id: string,
  input: FrameworkVersionUpdateInput,
): Promise<FrameworkVersion> {
  const payload = {
    framework_id: input.framework_id,
    version_number: input.version_number.trim(),
    version_name: input.version_name.trim(),
    description: input.description,
    effective_from: input.effective_from,
    effective_to: input.effective_to,
  };
  const { data, error } = await versionsTable()
    .update(payload)
    .eq("id", id)
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data as FrameworkVersion;
}

export async function archiveFrameworkVersion(id: string): Promise<FrameworkVersion> {
  const { data, error } = await versionsTable()
    .update({ status: "archived", is_current: false })
    .eq("id", id)
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data as FrameworkVersion;
}

export function friendlyFrameworkVersionError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? "");
  const code = (err as { code?: string } | null)?.code ?? "";
  if (
    code === "23505" ||
    /duplicate key|unique/i.test(message) ||
    /uq_framework_version/i.test(message)
  ) {
    return "A version with this number already exists for the selected Framework.";
  }
  if (code === "23503" || /foreign key/i.test(message)) {
    return "The selected Framework is invalid or no longer exists.";
  }
  if (code === "42501" || /permission denied|not authorized/i.test(message)) {
    return "You don't have permission to perform this action.";
  }
  if (/PGRST106|Invalid schema/i.test(message)) {
    return "The 'app' schema is not exposed via the Supabase Data API.";
  }
  if (/Failed to fetch|NetworkError/i.test(message)) {
    return "Network error. Check your connection and try again.";
  }
  return message || "Something went wrong. Please try again.";
}