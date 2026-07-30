import { supabase } from "@/integrations/supabase/client";
import type { MyAssessmentRow } from "./types";

function appSchema() {
  return (supabase as unknown as {
    schema: (name: string) => { from: (table: string) => any };
  }).schema("app");
}

export async function listMyAssessments(userId: string): Promise<MyAssessmentRow[]> {
  const { data, error } = await appSchema()
    .from("assessment_responses")
    .select(
      "id, status, assessment:assessments!fk_responses_assessment(id, status, created_at, organization:organizations!fk_assessments_organization(name), framework_version:framework_versions!fk_assessments_framework_version(version_number, framework:frameworks!fk_framework_versions_framework(code)))",
    )
    .eq("assigned_to", userId)
    .limit(2000);
  if (error) throw error;

  const rows = (data ?? []) as Array<{
    id: string;
    status: string;
    assessment: {
      id: string;
      status: string;
      created_at: string;
      organization: { name: string } | null;
      framework_version:
        | { version_number: string; framework: { code: string } | null }
        | null;
    } | null;
  }>;

  const map = new Map<string, MyAssessmentRow & { created_at: string }>();
  for (const r of rows) {
    const a = r.assessment;
    if (!a) continue;
    let entry = map.get(a.id);
    if (!entry) {
      entry = {
        assessment_id: a.id,
        status: a.status,
        organization_name: a.organization?.name ?? "—",
        framework_code: a.framework_version?.framework?.code ?? "—",
        version_number: a.framework_version?.version_number ?? "—",
        completed_count: 0,
        total_count: 0,
        progress: 0,
        created_at: a.created_at,
      };
      map.set(a.id, entry);
    }
    entry.total_count += 1;
    if (r.status === "completed") entry.completed_count += 1;
  }

  return Array.from(map.values())
    .map((e) => ({
      ...e,
      progress:
        e.total_count > 0 ? Math.round((e.completed_count / e.total_count) * 100) : 0,
    }))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map(({ created_at: _created_at, ...rest }) => rest);
}

export function friendlyMyAssessmentError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? "");
  const code = (err as { code?: string } | null)?.code ?? "";
  if (code === "42501" || /permission denied|not authorized/i.test(message)) {
    return "You don't have permission to view these assessments.";
  }
  if (/PGRST106|Invalid schema/i.test(message)) {
    return "The 'app' schema is not exposed via the Supabase Data API.";
  }
  if (/Failed to fetch|NetworkError/i.test(message)) {
    return "Network error. Check your connection and try again.";
  }
  return message || "Something went wrong. Please try again.";
}