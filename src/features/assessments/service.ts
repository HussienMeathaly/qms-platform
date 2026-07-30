import { supabase } from "@/integrations/supabase/client";
import type {
  AssessmentRow,
  CreateAssessmentResult,
  FrameworkVersionOption,
  MemberOption,
  OrganizationOption,
} from "./types";

function appSchema() {
  return (supabase as unknown as {
    schema: (name: string) => {
      from: (table: string) => any;
      rpc: (fn: string, args: Record<string, unknown>) => any;
    };
  }).schema("app");
}

export async function listAssessments(): Promise<AssessmentRow[]> {
  const { data, error } = await appSchema()
    .from("assessments")
    .select(
      "id, status, created_at, organization:organizations!fk_assessments_organization(code, name), framework_version:framework_versions!fk_assessments_framework_version(version_number, version_name, framework:frameworks!fk_framework_versions_framework(code)), assessment_responses:assessment_responses!fk_responses_assessment(assigned_to)",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;

  const rows = (data ?? []) as Array<{
    id: string;
    status: string;
    created_at: string;
    organization: { code: string; name: string } | null;
    framework_version:
      | {
          version_number: string;
          version_name: string;
          framework: { code: string } | null;
        }
      | null;
    assessment_responses: Array<{ assigned_to: string | null }> | null;
  }>;

  const userIds = Array.from(
    new Set(
      rows
        .map((r) => r.assessment_responses?.[0]?.assigned_to)
        .filter((v): v is string => Boolean(v)),
    ),
  );

  const names = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles, error: pErr } = await appSchema()
      .from("user_profiles")
      .select("id, full_name")
      .in("id", userIds);
    if (pErr) throw pErr;
    for (const p of (profiles ?? []) as Array<{ id: string; full_name: string }>) {
      names.set(p.id, p.full_name);
    }
  }

  return rows.map((r) => {
    const assignedId = r.assessment_responses?.[0]?.assigned_to ?? null;
    return {
      id: r.id,
      status: r.status,
      created_at: r.created_at,
      organization_code: r.organization?.code ?? "—",
      organization_name: r.organization?.name ?? "",
      framework_code: r.framework_version?.framework?.code ?? "—",
      version_number: r.framework_version?.version_number ?? "—",
      version_name: r.framework_version?.version_name ?? "",
      assigned_user: assignedId ? (names.get(assignedId) ?? "—") : "—",
      responses_count: r.assessment_responses?.length ?? 0,
    };
  });
}

export async function listActiveOrganizations(): Promise<OrganizationOption[]> {
  const { data, error } = await appSchema()
    .from("organizations")
    .select("id, code, name")
    .eq("status", "active")
    .order("code", { ascending: true })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as OrganizationOption[];
}

export async function listPublishedFrameworkVersions(): Promise<FrameworkVersionOption[]> {
  const { data, error } = await appSchema()
    .from("framework_versions")
    .select(
      "id, version_number, version_name, framework:frameworks!fk_framework_versions_framework(code)",
    )
    .eq("status", "published")
    .order("version_number", { ascending: true })
    .limit(1000);
  if (error) throw error;
  return ((data ?? []) as Array<{
    id: string;
    version_number: string;
    version_name: string;
    framework: { code: string } | null;
  }>).map((v) => ({
    id: v.id,
    version_number: v.version_number,
    version_name: v.version_name,
    framework_code: v.framework?.code ?? "",
  }));
}

export async function listOrganizationMembers(organizationId: string): Promise<MemberOption[]> {
  const { data, error } = await appSchema()
    .from("organization_members")
    .select("user_id, role, user_profile:user_profiles!fk_org_members_user(id, full_name, job_title)")
    .eq("organization_id", organizationId)
    .in("role", ["org_admin", "org_contributor"])
    .limit(1000);
  if (error) throw error;
  return ((data ?? []) as Array<{
    user_id: string;
    user_profile: { id: string; full_name: string; job_title: string | null } | null;
  }>)
    .filter((m) => m.user_profile)
    .map((m) => ({
      id: m.user_id,
      full_name: m.user_profile!.full_name,
      job_title: m.user_profile!.job_title,
    }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export async function createAssessmentWithResponses(input: {
  organizationId: string;
  frameworkVersionId: string;
  assignedTo: string;
}): Promise<CreateAssessmentResult> {
  const { data, error } = await appSchema().rpc("create_assessment_with_responses", {
    p_organization_id: input.organizationId,
    p_framework_version_id: input.frameworkVersionId,
    p_assigned_to: input.assignedTo,
  });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as CreateAssessmentResult | undefined;
  return {
    assessment_id: row?.assessment_id ?? "",
    responses_created: row?.responses_created ?? 0,
  };
}

export function friendlyAssessmentError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? "");
  const code = (err as { code?: string } | null)?.code ?? "";
  if (
    code === "23505" ||
    /duplicate key|unique|uq_assessments_organization_framework_version|already exists/i.test(
      message,
    )
  ) {
    return "An Assessment already exists for this Organization and Framework Version.";
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