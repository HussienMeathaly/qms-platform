import { supabase } from "@/integrations/supabase/client";
import type {
  FrameworkVersionOption,
  Level,
  LevelCreateInput,
  LevelUpdateInput,
  ListLevelsParams,
  ListLevelsResult,
} from "./types";

function appSchema() {
  return (supabase as unknown as {
    schema: (name: string) => { from: (table: string) => any };
  }).schema("app");
}

function levelsTable() {
  return appSchema().from("levels");
}

function versionsTable() {
  return appSchema().from("framework_versions");
}

function principlesTable() {
  return appSchema().from("principles");
}

const SELECT_COLS =
  "id, framework_version_id, code, display_name, description, sort_order, created_at, updated_at, framework_version:framework_versions!fk_levels_framework_version(id, version_number, version_name, status, framework:frameworks!fk_framework_versions_framework(id, code, name))";

function escapeIlike(term: string): string {
  return term.replace(/[%,]/g, (m: string) => `\\${m}`);
}

export async function listSelectableFrameworkVersions(): Promise<FrameworkVersionOption[]> {
  const { data, error } = await versionsTable()
    .select(
      "id, version_number, version_name, status, framework:frameworks!fk_framework_versions_framework(code, name)",
    )
    .neq("status", "archived")
    .order("code", { ascending: true, foreignTable: "frameworks" })
    .order("version_number", { ascending: true })
    .limit(1000);
  if (error) throw error;
  return ((data ?? []) as Array<{
    id: string;
    version_number: string;
    version_name: string;
    status: "draft" | "published" | "archived";
    framework: { code: string; name: string } | null;
  }>).map((r) => ({
    id: r.id,
    version_number: r.version_number,
    version_name: r.version_name,
    status: r.status,
    framework_code: r.framework?.code ?? "",
    framework_name: r.framework?.name ?? "",
  }));
}

export async function listLevels(params: ListLevelsParams): Promise<ListLevelsResult> {
  const { search, sortField, sortDirection, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const ascending = sortDirection === "asc";

  let query = levelsTable().select(SELECT_COLS, { count: "exact" });

  const term = search?.trim();
  if (term) {
    const escaped = escapeIlike(term);
    // Find matching framework version ids (by version number/name and framework code/name).
    const { data: fwMatches, error: fwErr } = await appSchema()
      .from("frameworks")
      .select("id")
      .or(`code.ilike.%${escaped}%,name.ilike.%${escaped}%`)
      .limit(1000);
    if (fwErr) throw fwErr;
    const fwIds = (fwMatches ?? []).map((r: { id: string }) => r.id);

    let vQuery = versionsTable()
      .select("id")
      .or(
        `version_number.ilike.%${escaped}%,version_name.ilike.%${escaped}%${
          fwIds.length > 0 ? `,framework_id.in.(${fwIds.join(",")})` : ""
        }`,
      )
      .limit(1000);
    const { data: vMatches, error: vErr } = await vQuery;
    if (vErr) throw vErr;
    const versionIds = (vMatches ?? []).map((r: { id: string }) => r.id);

    const parts = [
      `code.ilike.%${escaped}%`,
      `display_name.ilike.%${escaped}%`,
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
    query = query.order("version_number", {
      ascending,
      foreignTable: "framework_versions",
    });
  } else {
    query = query.order(sortField, { ascending, nullsFirst: !ascending });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as Level[], total: count ?? 0 };
}

export async function createLevel(input: LevelCreateInput): Promise<Level> {
  const payload = {
    framework_version_id: input.framework_version_id,
    code: input.code.trim(),
    display_name: input.display_name.trim(),
    description: input.description,
    sort_order: input.sort_order,
  };
  const { data, error } = await levelsTable()
    .insert(payload)
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data as Level;
}

export async function updateLevel(id: string, input: LevelUpdateInput): Promise<Level> {
  const payload = {
    framework_version_id: input.framework_version_id,
    code: input.code.trim(),
    display_name: input.display_name.trim(),
    description: input.description,
    sort_order: input.sort_order,
  };
  const { data, error } = await levelsTable()
    .update(payload)
    .eq("id", id)
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data as Level;
}

export async function deleteLevel(id: string): Promise<void> {
  const { error } = await levelsTable().delete().eq("id", id);
  if (error) throw error;
}

/**
 * Count dependent Principles referencing this Level. Used as a mandatory
 * safety check before deletion, independent of the ON DELETE CASCADE that
 * exists on the foreign key.
 */
export async function countLevelPrinciples(levelId: string): Promise<number> {
  const { count, error } = await principlesTable()
    .select("id", { count: "exact", head: true })
    .eq("level_id", levelId);
  if (error) throw error;
  return count ?? 0;
}

export function friendlyLevelError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? "");
  const code = (err as { code?: string } | null)?.code ?? "";
  if (code === "23505" || /duplicate key|unique/i.test(message)) {
    if (/uq_levels_sort_order|sort_order/i.test(message)) {
      return "Another Level in this Framework Version already uses this Sort Order.";
    }
    if (/uq_levels_code|\bcode\b/i.test(message)) {
      return "A Level with this Code already exists in the selected Framework Version.";
    }
    return "A Level with these values already exists in the selected Framework Version.";
  }
  if (code === "23503" || /foreign key/i.test(message)) {
    return "The selected Framework Version is invalid or no longer exists.";
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