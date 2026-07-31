import { supabase } from "@/integrations/supabase/client";
import type { ResponseTypeOption, WorkspaceData, WorkspaceRequirement } from "./types";

function appSchema() {
  return (supabase as unknown as {
    schema: (name: string) => { from: (table: string) => any };
  }).schema("app");
}

export class AssessmentNotFoundError extends Error {
  constructor() {
    super("Assessment not found or you do not have access to it.");
    this.name = "AssessmentNotFoundError";
  }
}

const PRINCIPLE_EMBED =
  "principle:principles!fk_requirements_principle(id, code, display_name, sort_order, level:levels!fk_principles_level(id, code, display_name, sort_order))";

const CLAUSES_EMBED =
  "clause_links:requirement_process_clauses!fk_rpc_requirement(process_clause:process_clauses!fk_rpc_process_clause(id, code, display_name, sort_order))";

const CRITERION_EMBED = `criterion:assessment_criteria!fk_responses_criterion(id, code, criterion_text, help_text, sort_order, requirement:requirements!fk_assessment_criteria_requirement(id, code, title, guidance, sort_order, ${PRINCIPLE_EMBED}, ${CLAUSES_EMBED}))`;

const ASSESSMENT_EMBED =
  "assessment:assessments!fk_responses_assessment(id, status, organization:organizations!fk_assessments_organization(name), framework_version:framework_versions!fk_assessments_framework_version(version_number, framework:frameworks!fk_framework_versions_framework(code, name)))";

type RawRow = {
  id: string;
  status: string;
  response_type_id: string | null;
  criterion: {
    id: string;
    code: string | null;
    criterion_text: string;
    help_text: string | null;
    sort_order: number;
    requirement: {
      id: string;
      code: string | null;
      title: string;
      guidance: string | null;
      sort_order: number;
      principle: {
        id: string;
        code: string | null;
        display_name: string;
        sort_order: number;
        level: {
          id: string;
          code: string | null;
          display_name: string;
          sort_order: number;
        } | null;
      } | null;
      clause_links:
        | Array<{
            process_clause: {
              id: string;
              code: string | null;
              display_name: string;
              sort_order: number;
            } | null;
          }>
        | null;
    } | null;
  } | null;
  assessment: {
    id: string;
    status: string;
    organization: { name: string } | null;
    framework_version: {
      version_number: string;
      framework: { code: string; name: string } | null;
    } | null;
  } | null;
};

export async function loadWorkspace(
  assessmentId: string,
  userId: string,
): Promise<WorkspaceData> {
  const { data, error } = await appSchema()
    .from("assessment_responses")
    .select(`id, status, response_type_id, ${CRITERION_EMBED}, ${ASSESSMENT_EMBED}`)
    .eq("assessment_id", assessmentId)
    .eq("assigned_to", userId)
    .limit(2000);
  if (error) throw error;

  const rows = (data ?? []) as RawRow[];
  if (rows.length === 0) throw new AssessmentNotFoundError();

  const assessment = rows.find((r) => r.assessment)?.assessment ?? null;
  if (!assessment) throw new AssessmentNotFoundError();

  const byRequirement = new Map<string, WorkspaceRequirement>();
  let completed = 0;
  let total = 0;

  for (const row of rows) {
    const c = row.criterion;
    const req = c?.requirement;
    if (!c || !req) continue;
    total += 1;
    if (row.status === "completed") completed += 1;

    let entry = byRequirement.get(req.id);
    if (!entry) {
      entry = {
        id: req.id,
        code: req.code,
        title: req.title,
        description: req.guidance ?? null,
        sort_order: req.sort_order ?? 0,
        level_id: req.principle?.level?.id ?? null,
        level_code: req.principle?.level?.code ?? null,
        level_name: req.principle?.level?.display_name ?? "",
        level_sort: req.principle?.level?.sort_order ?? 0,
        principle_id: req.principle?.id ?? null,
        principle_code: req.principle?.code ?? null,
        principle_name: req.principle?.display_name ?? "",
        principle_sort: req.principle?.sort_order ?? 0,
        process_clauses: (req.clause_links ?? [])
          .map((l) => l.process_clause)
          .filter((c): c is NonNullable<typeof c> => Boolean(c))
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
        criteria: [],
      };
      byRequirement.set(req.id, entry);
    }
    entry.criteria.push({
      response_id: row.id,
      criterion_id: c.id,
      code: c.code,
      title: c.criterion_text,
      description: c.help_text ?? null,
      sort_order: c.sort_order ?? 0,
      status: row.status,
      response_type_id: row.response_type_id,
    });
  }

  const requirements = Array.from(byRequirement.values())
    .map((r) => ({
      ...r,
      criteria: r.criteria.sort(
        (a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title),
      ),
    }))
    .sort(
      (a, b) =>
        a.level_sort - b.level_sort ||
        a.principle_sort - b.principle_sort ||
        a.sort_order - b.sort_order,
    );

  return {
    assessment_id: assessment.id,
    assessment_status: assessment.status,
    organization_name: assessment.organization?.name ?? "—",
    framework_name: assessment.framework_version?.framework?.name ?? "Assessment",
    framework_code: assessment.framework_version?.framework?.code ?? "—",
    version_number: assessment.framework_version?.version_number ?? "—",
    requirements,
    total_count: total,
    completed_count: completed,
  };
}

export async function listResponseTypes(): Promise<ResponseTypeOption[]> {
  const { data, error } = await appSchema()
    .from("response_types")
    .select("id, code, display_name, description, color, sort_order, score")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as ResponseTypeOption[];
}

export async function saveResponse(input: {
  responseId: string;
  responseTypeId: string;
  assessmentId: string;
  assessmentStatus: string;
}): Promise<void> {
  const { error } = await appSchema()
    .from("assessment_responses")
    .update({ response_type_id: input.responseTypeId, status: "completed" })
    .eq("id", input.responseId);
  if (error) throw error;

  if (input.assessmentStatus === "draft") {
    const { error: aErr } = await appSchema()
      .from("assessments")
      .update({ status: "in_progress" })
      .eq("id", input.assessmentId)
      .eq("status", "draft");
    if (aErr) throw aErr;
  }
}

export function friendlyWorkspaceError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? "");
  const code = (err as { code?: string } | null)?.code ?? "";
  if (err instanceof AssessmentNotFoundError) return message;
  if (code === "42501" || /permission denied|not authorized/i.test(message)) {
    return "You don't have permission to perform this action.";
  }
  if (/PGRST106|Invalid schema/i.test(message)) {
    return "The 'app' schema is not exposed via the Supabase Data API.";
  }
  if (/Failed to fetch|NetworkError/i.test(message)) {
    return "Network error. Check your connection and try again.";
  }
  return message || "Unable to load the Assessment.";
}