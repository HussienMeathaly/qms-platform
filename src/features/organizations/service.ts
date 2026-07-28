import { supabase } from "@/integrations/supabase/client";
import type {
  ListOrganizationsParams,
  ListOrganizationsResult,
  Organization,
  OrganizationInput,
} from "./types";

// The organizations table lives in the `app` schema. Types for that schema are
// not in the generated `Database` type, so we scope-cast the client.
function orgTable() {
  return (supabase as unknown as {
    schema: (name: string) => {
      from: (table: string) => any;
    };
  })
    .schema("app")
    .from("organizations");
}

export async function listOrganizations(
  params: ListOrganizationsParams,
): Promise<ListOrganizationsResult> {
  const { search, sortField, sortDirection, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = orgTable()
    .select("id, code, name, status, created_at, updated_at", { count: "exact" });

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
  return { rows: (data ?? []) as Organization[], total: count ?? 0 };
}

export async function createOrganization(input: OrganizationInput): Promise<Organization> {
  const { data, error } = await orgTable().insert(input).select().single();
  if (error) throw error;
  return data as Organization;
}

export async function updateOrganization(
  id: string,
  input: OrganizationInput,
): Promise<Organization> {
  const { data, error } = await orgTable().update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as Organization;
}

export async function deleteOrganization(id: string): Promise<void> {
  const { error } = await orgTable().delete().eq("id", id);
  if (error) throw error;
}

export function friendlyOrganizationError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? "");
  const code = (err as { code?: string } | null)?.code ?? "";
  if (code === "23505" || /duplicate key|unique/i.test(message)) {
    return "An organization with this code already exists. Choose a different code.";
  }
  if (code === "23503" || /foreign key/i.test(message)) {
    return "This organization is referenced by other records and cannot be deleted.";
  }
  if (code === "42501" || /permission denied|not authorized/i.test(message)) {
    return "You don't have permission to perform this action.";
  }
  if (/PGRST106|Invalid schema/i.test(message)) {
    return "The 'app' schema is not exposed via the Supabase Data API. Add 'app' under Project Settings → API → Exposed schemas.";
  }
  return message || "Something went wrong. Please try again.";
}