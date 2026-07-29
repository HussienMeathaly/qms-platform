import { supabase } from "@/integrations/supabase/client";
import type {
  LevelOption,
  ListPrinciplesParams,
  ListPrinciplesResult,
  Principle,
  PrincipleCreateInput,
  PrincipleUpdateInput,
} from "./types";

function appSchema() {
  return (supabase as unknown as {
    schema: (name: string) => { from: (table: string) => any };
  }).schema("app");
}

function principlesTable() {
  return appSchema().from("principles");
}

function levelsTable() {
  return appSchema().from("levels");
}

function versionsTable() {
  return appSchema().from("framework_versions");
}

function requirementsTable() {
  return appSchema().from("requirements");
}

const SELECT_COLS =
  "id, level_id, code, display_name, description, sort_order, created_at, updated_at, level:levels!fk_principles_level(id, code, display_name, sort_order, framework_version:framework_versions!fk_levels_framework_version(id, version_number, version_name, status, framework:frameworks!fk_framework_versions_framework(id, code, name)))";

function escapeIlike(term: string): string {
  return term.replace(/[%,]/g, (m: string) => `\\${m}`);
}

export async function listSelectableLevels(): Promise<LevelOption[]> {
  const { data, error } = await levelsTable()
    .select(
      "id, code, display_name, sort_order, framework_version:framework_versions!fk_levels_framework_version(id, version_number, version_name, status, framework:frameworks!fk_framework_versions_framework(code, name))",
    )
    .limit(1000);
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string;
    code: string;
    display_name: string;
    sort_order: number;
    framework_version: {
      id: string;
      version_number: string;
      version_name: string;
      status: "draft" | "published" | "archived";
      framework: { code: string; name: string } | null;
    } | null;
  }>;
  const filtered = rows.filter((r) => r.framework_version && r.framework_version.status !== "archived");
  filtered.sort((a, b) => {
    const fa = a.framework_version!.framework?.code ?? "";
    const fb = b.framework_version!.framework?.code ?? "";
    if (fa !== fb) return fa.localeCompare(fb);
    const va = a.framework_version!.version_number;
    const vb = b.framework_version!.version_number;
    if (va !== vb) return va.localeCompare(vb);
    return a.sort_order - b.sort_order;
  });
  return filtered.map((r) => ({
    id: r.id,
    code: r.code,
    display_name: r.display_name,
    sort_order: r.sort_order,
    framework_version_id: r.framework_version!.id,
    framework_version_number: r.framework_version!.version_number,
    framework_version_name: r.framework_version!.version_name,
    framework_version_status: r.framework_version!.status,
    framework_code: r.framework_version!.framework?.code ?? "",
    framework_name: r.framework_version!.framework?.name ?? "",
  }));
}

export async function listPrinciples(params: ListPrinciplesParams): Promise<ListPrinciplesResult> {
  const { search, sortField, sortDirection, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const ascending = sortDirection === "asc";

  let query = principlesTable().select(SELECT_COLS, { count: "exact" });

  const term = search?.trim();
  if (term) {
    const escaped = escapeIlike(term);

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

    const levelOrParts = [
      `code.ilike.%${escaped}%`,
      `display_name.ilike.%${escaped}%`,
    ];
    if (versionIds.length > 0) {
      levelOrParts.push(`framework_version_id.in.(${versionIds.join(",")})`);
    }
    const { data: lMatches, error: lErr } = await levelsTable()
      .select("id")
      .or(levelOrParts.join(","))
      .limit(1000);
    if (lErr) throw lErr;
    const levelIds = (lMatches ?? []).map((r: { id: string }) => r.id);

    const parts = [
      `code.ilike.%${escaped}%`,
      `display_name.ilike.%${escaped}%`,
    ];
    if (levelIds.length > 0) {
      parts.push(`level_id.in.(${levelIds.join(",")})`);
    }
    query = query.or(parts.join(","));
  }

  if (sortField === "framework") {
    query = query.order("code", {
      ascending,
      foreignTable: "levels.framework_versions.frameworks",
    });
  } else if (sortField === "version") {
    query = query.order("version_number", {
      ascending,
      foreignTable: "levels.framework_versions",
    });
  } else if (sortField === "level") {
    query = query.order("sort_order", {
      ascending,
      foreignTable: "levels",
    });
  } else {
    query = query.order(sortField, { ascending, nullsFirst: !ascending });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as Principle[], total: count ?? 0 };
}

export async function createPrinciple(input: PrincipleCreateInput): Promise<Principle> {
  const payload = {
    level_id: input.level_id,
    code: input.code.trim(),
    display_name: input.display_name.trim(),
    description: input.description,
    sort_order: input.sort_order,
  };
  const { data, error } = await principlesTable()
    .insert(payload)
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data as Principle;
}

export async function updatePrinciple(id: string, input: PrincipleUpdateInput): Promise<Principle> {
  const payload = {
    level_id: input.level_id,
    code: input.code.trim(),
    display_name: input.display_name.trim(),
    description: input.description,
    sort_order: input.sort_order,
  };
  const { data, error } = await principlesTable()
    .update(payload)
    .eq("id", id)
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data as Principle;
}

export async function deletePrinciple(id: string): Promise<void> {
  const { error } = await principlesTable().delete().eq("id", id);
  if (error) throw error;
}

/**
 * Count dependent Requirements referencing this Principle. Used as a mandatory
 * safety check before deletion, independent of the ON DELETE CASCADE that
 * exists on the foreign key.
 */
export async function countPrincipleRequirements(principleId: string): Promise<number> {
  const { count, error } = await requirementsTable()
    .select("id", { count: "exact", head: true })
    .eq("principle_id", principleId);
  if (error) throw error;
  return count ?? 0;
}

export function friendlyPrincipleError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? "");
  const code = (err as { code?: string } | null)?.code ?? "";
  if (code === "23505" || /duplicate key|unique/i.test(message)) {
    if (/uq_principles_sort_order|sort_order/i.test(message)) {
      return "Another Principle in this Level already uses this Sort Order.";
    }
    if (/uq_principles_code|\bcode\b/i.test(message)) {
      return "A Principle with this Code already exists in the selected Level.";
    }
    return "A Principle with these values already exists in the selected Level.";
  }
  if (code === "23503" || /foreign key/i.test(message)) {
    return "The selected Level is invalid or no longer exists.";
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