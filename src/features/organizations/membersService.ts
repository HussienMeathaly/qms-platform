import { supabase } from "@/integrations/supabase/client";

export type OrganizationRole = "org_admin" | "org_contributor" | "viewer";

export const ORGANIZATION_ROLES: { value: OrganizationRole; label: string }[] = [
  { value: "org_admin", label: "Organization Admin" },
  { value: "org_contributor", label: "Organization Contributor" },
  { value: "viewer", label: "Viewer" },
];

export type OrganizationMember = {
  user_id: string;
  role: OrganizationRole;
  full_name: string;
  job_title: string | null;
};

export type UserProfileOption = {
  id: string;
  full_name: string;
  job_title: string | null;
};

function appSchema() {
  return (supabase as unknown as {
    schema: (name: string) => { from: (table: string) => any };
  }).schema("app");
}

export async function listMembers(organizationId: string): Promise<OrganizationMember[]> {
  const { data, error } = await appSchema()
    .from("organization_members")
    .select("user_id, role, user_profile:user_profiles!fk_org_members_user(id, full_name, job_title)")
    .eq("organization_id", organizationId)
    .limit(1000);
  if (error) throw error;
  return ((data ?? []) as Array<{
    user_id: string;
    role: OrganizationRole;
    user_profile: { id: string; full_name: string; job_title: string | null } | null;
  }>)
    .map((m) => ({
      user_id: m.user_id,
      role: m.role,
      full_name: m.user_profile?.full_name ?? "—",
      job_title: m.user_profile?.job_title ?? null,
    }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export async function listUserProfiles(): Promise<UserProfileOption[]> {
  const { data, error } = await appSchema()
    .from("user_profiles")
    .select("id, full_name, job_title")
    .order("full_name", { ascending: true })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as UserProfileOption[];
}

export async function addMember(input: {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
}): Promise<void> {
  const { error } = await appSchema().from("organization_members").insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    role: input.role,
  });
  if (error) throw error;
}

export async function updateMemberRole(input: {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
}): Promise<void> {
  const { error } = await appSchema()
    .from("organization_members")
    .update({ role: input.role })
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.userId);
  if (error) throw error;
}

export async function removeMember(input: {
  organizationId: string;
  userId: string;
}): Promise<void> {
  const { error } = await appSchema()
    .from("organization_members")
    .delete()
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.userId);
  if (error) throw error;
}