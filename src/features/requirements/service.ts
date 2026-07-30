import { supabase } from "@/integrations/supabase/client";
import type {
  ListRequirementsParams,
  ListRequirementsResult,
  PrincipleOption,
  Requirement,
  RequirementCreateInput,
  RequirementDependencyCounts,
  RequirementUpdateInput,
} from "./types";

function appSchema() {
  return (supabase as unknown as {
    schema: (name: string) => { from: (table: string) => any };
  }).schema("app");
}

function requirementsTable() {
  return appSchema().from("requirements");
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

const PRINCIPLE_EMBED =
  "principle:principles!fk_requirements_principle(id, code, display_name, sort_order, level:levels!fk_principles_level(id, code, display_name, sort_order, framework_version:framework_versions!fk_levels_framework_version(id, version_number, version_name, status, framework:frameworks!fk_framework_versions_framework(id, code, name))))";

const SELECT_COLS = `id, principle_id, code, title, guidance, sort_order, created_at, updated_at, ${PRINCIPLE_EMBED}`;

function escapeIlike(term: string): string {
  return term.replace(/[%,]/g, (m: string) => `\\${m}`);
}

/** Principles selectable as a Requirement parent (archived versions excluded). */
export async function listSelectablePrinciples(): Promise<PrincipleOption[]> {
  const { data, error } = await principlesTable()
    .select(
      "id, code, display_name, sort_order, level:levels!fk_principles_level(code, display_name, sort_order, framework_version:framework_versions!fk_levels_framework_version(version_number, version_name, status, framework:frameworks!fk_framework_versions_framework(code, name)))",
    )
    .limit(1000);
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string;
    code: string;
    display_name: string;
    sort_order: number;
    level: {
      code: string;
      display_name: string;
      sort_order: number;
      framework_version: {
        version_number: string;
        version_name: string;
        status: "draft" | "published" | "archived";
        framework: { code: string; name: string } | null;
      } | null;
    } | null;
  }>;
  const filtered = rows.filter(
    (r) => r.level?.framework_version && r.level.framework_version.status !== "archived",
  );
  filtered.sort((a, b) => {
    const fa = a.level!.framework_version!.framework?.code ?? "";
    const fb = b.level!.framework_version!.framework?.code ?? "";
    if (fa !== fb) return fa.localeCompare(fb);
    const va = a.level!.framework_version!.version_number;
    const vb = b.level!.framework_version!.version_number;
    if (va !== vb) return va.localeCompare(vb);
    if (a.level!.sort_order !== b.level!.sort_order) return a.level!.sort_order - b.level!.sort_order;
    return a.sort_order - b.sort_order;
  });
  return filtered.map((r) => {
    const lv = r.level!;
    const fv = lv.framework_version!;
    return {
      id: r.id,
      code: r.code,
      display_name: r.display_name,
      sort_order: r.sort_order,
      level_code: lv.code,
      level_display_name: lv.display_name,
      framework_version_number: fv.version_number,
      framework_version_name: fv.version_name,
      framework_version_status: fv.status,
      framework_code: fv.framework?.code ?? "",
      framework_name: fv.framework?.name ?? "",
    };
  });
}

export async function listRequirements(
  params: ListRequirementsParams,
): Promise<ListRequirementsResult> {
  const { search, sortField, sortDirection, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const ascending = sortDirection === "asc";

  let query = requirementsTable().select(SELECT_COLS, { count: "exact" });

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

    const levelOrParts = [`code.ilike.%${escaped}%`, `display_name.ilike.%${escaped}%`];
    if (versionIds.length > 0) {
      levelOrParts.push(`framework_version_id.in.(${versionIds.join(",")})`);
    }
    const { data: lMatches, error: lErr } = await levelsTable()
      .select("id")
      .or(levelOrParts.join(","))
      .limit(1000);
    if (lErr) throw lErr;
    const levelIds = (lMatches ?? []).map((r: { id: string }) => r.id);

    const principleOrParts = [`code.ilike.%${escaped}%`, `display_name.ilike.%${escaped}%`];
    if (levelIds.length > 0) {
      principleOrParts.push(`level_id.in.(${levelIds.join(",")})`);
    }
    const { data: pMatches, error: pErr } = await principlesTable()
      .select("id")
      .or(principleOrParts.join(","))
      .limit(1000);
    if (pErr) throw pErr;
    const principleIds = (pMatches ?? []).map((r: { id: string }) => r.id);

    const parts = [
      `code.ilike.%${escaped}%`,
      `title.ilike.%${escaped}%`,
      `guidance.ilike.%${escaped}%`,
    ];
    if (principleIds.length > 0) {
      parts.push(`principle_id.in.(${principleIds.join(",")})`);
    }
    query = query.or(parts.join(","));
  }

  if (sortField === "framework") {
    query = query.order("code", {
      ascending,
      foreignTable: "principles.levels.framework_versions.frameworks",
    });
  } else if (sortField === "version") {
    query = query.order("version_number", {
      ascending,
      foreignTable: "principles.levels.framework_versions",
    });
  } else if (sortField === "level") {
    query = query.order("sort_order", { ascending, foreignTable: "principles.levels" });
  } else if (sortField === "principle") {
    query = query.order("sort_order", { ascending, foreignTable: "principles" });
  } else {
    query = query.order(sortField, { ascending, nullsFirst: !ascending });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as Requirement[], total: count ?? 0 };
}

function toPayload(input: RequirementCreateInput) {
  const guidance = input.guidance?.trim();
  return {
    principle_id: input.principle_id,
    code: input.code.trim(),
    title: input.title.trim(),
    guidance: guidance ? guidance : null,
    sort_order: input.sort_order,
  };
}

export async function createRequirement(input: RequirementCreateInput): Promise<Requirement> {
  const { data, error } = await requirementsTable()
    .insert(toPayload(input))
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data as Requirement;
}

export async function updateRequirement(
  id: string,
  input: RequirementUpdateInput,
): Promise<Requirement> {
  const { data, error } = await requirementsTable()
    .update(toPayload(input))
    .eq("id", id)
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data as Requirement;
}

export async function deleteRequirement(id: string): Promise<void> {
  const { error } = await requirementsTable().delete().eq("id", id);
  if (error) throw error;
}

async function countIn(table: string, requirementId: string): Promise<number> {
  const { count, error } = await appSchema()
    .from(table)
    .select("requirement_id", { count: "exact", head: true })
    .eq("requirement_id", requirementId);
  if (error) throw error;
  return count ?? 0;
}

/**
 * Count every dependent record referencing this Requirement. Deletion is blocked
 * by the application whenever any count is non-zero, independent of the database
 * ON DELETE behaviour.
 */
export async function countRequirementDependencies(
  requirementId: string,
): Promise<RequirementDependencyCounts> {
  const [assessment_criteria, requirement_process_clauses, review_comments] = await Promise.all([
    countIn("assessment_criteria", requirementId),
    countIn("requirement_process_clauses", requirementId),
    countIn("review_comments", requirementId),
  ]);
  return { assessment_criteria, requirement_process_clauses, review_comments };
}

export function friendlyRequirementError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? "");
  const code = (err as { code?: string } | null)?.code ?? "";
  if (code === "23505" || /duplicate key|unique/i.test(message)) {
    if (/uq_requirements_sort_order|sort_order/i.test(message)) {
      return "Another Requirement under this Principle already uses this Sort Order.";
    }
    if (/uq_requirements_code|\bcode\b/i.test(message)) {
      return "A Requirement with this Code already exists under the selected Principle. Choose a different Code.";
    }
    return "A Requirement with these values already exists under the selected Principle.";
  }
  if (code === "23503" || /foreign key/i.test(message)) {
    return "The selected Principle is invalid or no longer exists.";
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