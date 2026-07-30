import { supabase } from "@/integrations/supabase/client";
import type {
  FrameworkVersionOption,
  ListProcessClausesParams,
  ListProcessClausesResult,
  ProcessClause,
  ProcessClauseCreateInput,
  ProcessClauseDependencyCounts,
  ProcessClauseUpdateInput,
} from "./types";

function appSchema() {
  return (supabase as unknown as {
    schema: (name: string) => { from: (table: string) => any };
  }).schema("app");
}

function clausesTable() {
  return appSchema().from("process_clauses");
}

function versionsTable() {
  return appSchema().from("framework_versions");
}

const VERSION_EMBED =
  "framework_version:framework_versions!fk_process_clauses_framework_version(id, version_number, version_name, status, framework:frameworks!fk_framework_versions_framework(id, code, name))";

const SELECT_COLS = `id, framework_version_id, code, display_name, description, sort_order, created_at, updated_at, ${VERSION_EMBED}`;

function escapeIlike(term: string): string {
  return term.replace(/[%,]/g, (m: string) => `\\${m}`);
}

/** Framework Versions selectable as a Process Clause parent (archived excluded). */
export async function listSelectableFrameworkVersions(): Promise<FrameworkVersionOption[]> {
  const { data, error } = await versionsTable()
    .select(
      "id, version_number, version_name, status, framework:frameworks!fk_framework_versions_framework(code, name)",
    )
    .limit(1000);
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string;
    version_number: string;
    version_name: string;
    status: "draft" | "published" | "archived";
    framework: { code: string; name: string } | null;
  }>;
  const filtered = rows.filter((v) => v.status !== "archived");
  filtered.sort((a, b) => {
    const fa = a.framework?.code ?? "";
    const fb = b.framework?.code ?? "";
    if (fa !== fb) return fa.localeCompare(fb);
    return a.version_number.localeCompare(b.version_number);
  });
  return filtered.map((v) => ({
    id: v.id,
    version_number: v.version_number,
    version_name: v.version_name,
    status: v.status,
    framework_code: v.framework?.code ?? "",
    framework_name: v.framework?.name ?? "",
  }));
}

export async function listProcessClauses(
  params: ListProcessClausesParams,
): Promise<ListProcessClausesResult> {
  const { search, sortField, sortDirection, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const ascending = sortDirection === "asc";

  let query = clausesTable().select(SELECT_COLS, { count: "exact" });

  const term = search?.trim();
  if (term) {
    const escaped = escapeIlike(term);

    // PostgREST cannot OR across nested embedded resources, so ancestors are
    // resolved with pre-lookups and folded into an id filter.
    const { data: fwMatches, error: fwErr } = await appSchema()
      .from("frameworks")
      .select("id")
      .or(`code.ilike.%${escaped}%,name.ilike.%${escaped}%`)
      .limit(1000);
    if (fwErr) throw fwErr;
    const fwIds = (fwMatches ?? []).map((r: { id: string }) => r.id);

    const { data: vMatches, error: vErr } = await versionsTable()
      .select("id")
      .or(
        `version_number.ilike.%${escaped}%,version_name.ilike.%${escaped}%${
          fwIds.length > 0 ? `,framework_id.in.(${fwIds.join(",")})` : ""
        }`,
      )
      .limit(1000);
    if (vErr) throw vErr;
    const versionIds = (vMatches ?? []).map((r: { id: string }) => r.id);

    const parts = [
      `code.ilike.%${escaped}%`,
      `display_name.ilike.%${escaped}%`,
      `description.ilike.%${escaped}%`,
    ];
    if (versionIds.length > 0) {
      parts.push(`framework_version_id.in.(${versionIds.join(",")})`);
    }
    query = query.or(parts.join(","));
  }

  if (sortField === "framework") {
    query = query.order("code", {
      ascending,
      foreignTable: "framework_versions.frameworks",
    });
  } else if (sortField === "version") {
    query = query.order("version_number", { ascending, foreignTable: "framework_versions" });
  } else {
    query = query.order(sortField, { ascending, nullsFirst: !ascending });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as ProcessClause[], total: count ?? 0 };
}

function toPayload(input: ProcessClauseCreateInput) {
  const description = input.description?.trim();
  return {
    framework_version_id: input.framework_version_id,
    code: input.code.trim(),
    display_name: input.display_name.trim(),
    description: description ? description : null,
    sort_order: input.sort_order,
  };
}

export async function createProcessClause(
  input: ProcessClauseCreateInput,
): Promise<ProcessClause> {
  const { data, error } = await clausesTable()
    .insert(toPayload(input))
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data as ProcessClause;
}

export async function updateProcessClause(
  id: string,
  input: ProcessClauseUpdateInput,
): Promise<ProcessClause> {
  const { data, error } = await clausesTable()
    .update(toPayload(input))
    .eq("id", id)
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data as ProcessClause;
}

export async function deleteProcessClause(id: string): Promise<void> {
  const { error } = await clausesTable().delete().eq("id", id);
  if (error) throw error;
}

/**
 * Count Requirement mappings referencing this Process Clause. Deletion is blocked
 * by the application whenever the count is non-zero, independent of the database
 * ON DELETE behaviour.
 */
export async function countProcessClauseDependencies(
  processClauseId: string,
): Promise<ProcessClauseDependencyCounts> {
  const { count, error } = await appSchema()
    .from("requirement_process_clauses")
    .select("process_clause_id", { count: "exact", head: true })
    .eq("process_clause_id", processClauseId);
  if (error) throw error;
  return { requirement_process_clauses: count ?? 0 };
}

export function friendlyProcessClauseError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? "");
  const code = (err as { code?: string } | null)?.code ?? "";
  if (code === "23505" || /duplicate key|unique/i.test(message)) {
    if (/uq_process_clauses_sort_order|sort_order/i.test(message)) {
      return "Another Process Clause in this Framework Version already uses this Sort Order.";
    }
    if (/uq_process_clauses_code|\bcode\b/i.test(message)) {
      return "A Process Clause with this Code already exists in the selected Framework Version. Choose a different Code.";
    }
    return "A Process Clause with these values already exists in the selected Framework Version.";
  }
  if (code === "23503" || /foreign key/i.test(message)) {
    return "The selected Framework Version is invalid, or this Process Clause is still referenced by other records.";
  }
  if (code === "23514" || /check constraint/i.test(message)) {
    return "One or more fields do not meet the required format.";
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