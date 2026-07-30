import { supabase } from "@/integrations/supabase/client";
import type {
  AssessmentCriterion,
  AssessmentCriterionCreateInput,
  AssessmentCriterionDependencyCounts,
  AssessmentCriterionUpdateInput,
  ListAssessmentCriteriaParams,
  ListAssessmentCriteriaResult,
  RequirementOption,
} from "./types";

function appSchema() {
  return (supabase as unknown as {
    schema: (name: string) => { from: (table: string) => any };
  }).schema("app");
}

function criteriaTable() {
  return appSchema().from("assessment_criteria");
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

const REQUIREMENT_EMBED = `requirement:requirements!fk_assessment_criteria_requirement(id, code, title, sort_order, ${PRINCIPLE_EMBED})`;

const SELECT_COLS = `id, requirement_id, code, criterion_text, help_text, sort_order, created_at, updated_at, ${REQUIREMENT_EMBED}`;

function escapeIlike(term: string): string {
  return term.replace(/[%,]/g, (m: string) => `\\${m}`);
}

/** Requirements selectable as an Assessment Criterion parent (archived versions excluded). */
export async function listSelectableRequirements(): Promise<RequirementOption[]> {
  const { data, error } = await requirementsTable()
    .select(`id, code, title, sort_order, ${PRINCIPLE_EMBED}`)
    .limit(1000);
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string;
    code: string;
    title: string;
    sort_order: number;
    principle: {
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
    } | null;
  }>;
  const filtered = rows.filter(
    (r) =>
      r.principle?.level?.framework_version &&
      r.principle.level.framework_version.status !== "archived",
  );
  filtered.sort((a, b) => {
    const la = a.principle!.level!;
    const lb = b.principle!.level!;
    const fa = la.framework_version!.framework?.code ?? "";
    const fb = lb.framework_version!.framework?.code ?? "";
    if (fa !== fb) return fa.localeCompare(fb);
    const va = la.framework_version!.version_number;
    const vb = lb.framework_version!.version_number;
    if (va !== vb) return va.localeCompare(vb);
    if (la.sort_order !== lb.sort_order) return la.sort_order - lb.sort_order;
    if (a.principle!.sort_order !== b.principle!.sort_order)
      return a.principle!.sort_order - b.principle!.sort_order;
    return a.sort_order - b.sort_order;
  });
  return filtered.map((r) => {
    const p = r.principle!;
    const lv = p.level!;
    const fv = lv.framework_version!;
    return {
      id: r.id,
      code: r.code,
      title: r.title,
      sort_order: r.sort_order,
      principle_code: p.code,
      principle_display_name: p.display_name,
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

export async function listAssessmentCriteria(
  params: ListAssessmentCriteriaParams,
): Promise<ListAssessmentCriteriaResult> {
  const { search, sortField, sortDirection, page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const ascending = sortDirection === "asc";

  let query = criteriaTable().select(SELECT_COLS, { count: "exact" });

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

    const reqOrParts = [`code.ilike.%${escaped}%`, `title.ilike.%${escaped}%`];
    if (principleIds.length > 0) {
      reqOrParts.push(`principle_id.in.(${principleIds.join(",")})`);
    }
    const { data: rMatches, error: rErr } = await requirementsTable()
      .select("id")
      .or(reqOrParts.join(","))
      .limit(1000);
    if (rErr) throw rErr;
    const requirementIds = (rMatches ?? []).map((r: { id: string }) => r.id);

    const parts = [
      `code.ilike.%${escaped}%`,
      `criterion_text.ilike.%${escaped}%`,
      `help_text.ilike.%${escaped}%`,
    ];
    if (requirementIds.length > 0) {
      parts.push(`requirement_id.in.(${requirementIds.join(",")})`);
    }
    query = query.or(parts.join(","));
  }

  if (sortField === "framework") {
    query = query.order("code", {
      ascending,
      foreignTable: "requirements.principles.levels.framework_versions.frameworks",
    });
  } else if (sortField === "version") {
    query = query.order("version_number", {
      ascending,
      foreignTable: "requirements.principles.levels.framework_versions",
    });
  } else if (sortField === "level") {
    query = query.order("sort_order", {
      ascending,
      foreignTable: "requirements.principles.levels",
    });
  } else if (sortField === "principle") {
    query = query.order("sort_order", { ascending, foreignTable: "requirements.principles" });
  } else if (sortField === "requirement") {
    query = query.order("sort_order", { ascending, foreignTable: "requirements" });
  } else {
    query = query.order(sortField, { ascending, nullsFirst: !ascending });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as AssessmentCriterion[], total: count ?? 0 };
}

function toPayload(input: AssessmentCriterionCreateInput) {
  const help = input.help_text?.trim();
  return {
    requirement_id: input.requirement_id,
    code: input.code.trim(),
    criterion_text: input.criterion_text.trim(),
    help_text: help ? help : null,
    sort_order: input.sort_order,
  };
}

export async function createAssessmentCriterion(
  input: AssessmentCriterionCreateInput,
): Promise<AssessmentCriterion> {
  const { data, error } = await criteriaTable()
    .insert(toPayload(input))
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data as AssessmentCriterion;
}

export async function updateAssessmentCriterion(
  id: string,
  input: AssessmentCriterionUpdateInput,
): Promise<AssessmentCriterion> {
  const { data, error } = await criteriaTable()
    .update(toPayload(input))
    .eq("id", id)
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data as AssessmentCriterion;
}

export async function deleteAssessmentCriterion(id: string): Promise<void> {
  const { error } = await criteriaTable().delete().eq("id", id);
  if (error) throw error;
}

/**
 * Count every Assessment Response referencing this Criterion. Deletion is blocked
 * by the application whenever the count is non-zero, independent of the database
 * ON DELETE behaviour.
 */
export async function countAssessmentCriterionDependencies(
  criterionId: string,
): Promise<AssessmentCriterionDependencyCounts> {
  const { count, error } = await appSchema()
    .from("assessment_responses")
    .select("criterion_id", { count: "exact", head: true })
    .eq("criterion_id", criterionId);
  if (error) throw error;
  return { assessment_responses: count ?? 0 };
}

export function friendlyAssessmentCriterionError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? "");
  const code = (err as { code?: string } | null)?.code ?? "";
  if (code === "23505" || /duplicate key|unique/i.test(message)) {
    if (/uq_assessment_criteria_sort_order|sort_order/i.test(message)) {
      return "Another Assessment Criterion under this Requirement already uses this Sort Order.";
    }
    if (/uq_assessment_criteria_code|\bcode\b/i.test(message)) {
      return "An Assessment Criterion with this Code already exists under the selected Requirement. Choose a different Code.";
    }
    return "An Assessment Criterion with these values already exists under the selected Requirement.";
  }
  if (code === "23503" || /foreign key/i.test(message)) {
    return "The selected Requirement is invalid, or this Criterion is still referenced by other records.";
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