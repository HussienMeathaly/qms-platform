import { supabase } from "@/integrations/supabase/client";
import type {
  Framework,
  FrameworkInput,
  ListFrameworksParams,
  ListFrameworksResult,
} from "./types";

function appSchema() {
  return (supabase as unknown as {
    schema: (name: string) => { from: (table: string) => any };
  }).schema("app");
}

function frameworkTable() {
  return appSchema().from("frameworks");
}

const SELECT_COLS = "id, code, name, description, status, is_active, created_at, updated_at";

export async function listFrameworks(
  params: ListFrameworksParams,
): Promise<ListFrameworksResult> {
  const { search, sortField, sortDirection, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = frameworkTable().select(SELECT_COLS, { count: "exact" });

  const term = search?.trim();
  if (term) {
    const escaped = term.replace(/[%,]/g, (m: string) => `\\${m}`);
    query = query.or(`name.ilike.%${escaped}%,code.ilike.%${escaped}%`);
  }

  query = query
    .order(sortField, { ascending: sortDirection === "asc" })
    .range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as Framework[], total: count ?? 0 };
}

export async function createFramework(input: FrameworkInput): Promise<Framework> {
  const { data, error } = await frameworkTable().insert(input).select().single();
  if (error) throw error;
  return data as Framework;
}

export async function updateFramework(
  id: string,
  input: FrameworkInput,
): Promise<Framework> {
  const { data, error } = await frameworkTable().update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as Framework;
}

export async function deleteFramework(id: string): Promise<void> {
  const { error } = await frameworkTable().delete().eq("id", id);
  if (error) throw error;
}

export async function archiveFramework(id: string): Promise<Framework> {
  const { data, error } = await frameworkTable()
    .update({ status: "archived", is_active: false })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Framework;
}

/**
 * Returns the number of records that reference this framework. When > 0,
 * hard delete is blocked and the caller should archive instead.
 */
export async function countFrameworkDependencies(id: string): Promise<number> {
  const { count, error } = await appSchema()
    .from("framework_versions")
    .select("id", { count: "exact", head: true })
    .eq("framework_id", id);
  if (error) throw error;
  return count ?? 0;
}

export function friendlyFrameworkError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? "");
  const code = (err as { code?: string } | null)?.code ?? "";
  if (code === "23505" || /duplicate key|unique/i.test(message)) {
    return "A framework with this code already exists. Choose a different code.";
  }
  if (code === "23503" || /foreign key/i.test(message)) {
    return "This framework is referenced by other records and cannot be deleted. Archive it instead.";
  }
  if (code === "42501" || /permission denied|not authorized/i.test(message)) {
    return "You don't have permission to perform this action.";
  }
  if (/PGRST106|Invalid schema/i.test(message)) {
    return "The 'app' schema is not exposed via the Supabase Data API.";
  }
  return message || "Something went wrong. Please try again.";
}