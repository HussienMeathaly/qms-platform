import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Role = "org_admin" | "org_contributor" | "viewer";

function appDb() {
  return (supabaseAdmin as unknown as {
    schema: (n: string) => { from: (t: string) => any };
  }).schema("app");
}

function tempPassword(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return (
    "Qa1!" +
    Array.from(bytes, (b) => b.toString(36)).join("").slice(0, 14)
  );
}

export async function createOrgUserImpl(input: {
  organizationId: string;
  email: string;
  fullName: string;
  jobTitle: string | null;
  role: Role;
  password?: string;
}): Promise<{ userId: string; tempPassword: string | null; existing: boolean }> {
  const email = input.email.toLowerCase();
  let userId: string | null = null;
  let password: string | null = input.password?.trim() ? input.password.trim() : tempPassword();
  let existing = false;

  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  });

  if (created.error) {
    const msg = created.error.message ?? "";
    if (!/already/i.test(msg)) throw new Error(msg || "Could not create the user account.");
    // User already exists — reuse the account.
    existing = true;
    password = null;
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listErr) throw new Error(listErr.message);
    userId = list.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
    if (!userId) throw new Error("A user with this email already exists but could not be located.");
  } else {
    userId = created.data.user!.id;
  }

  const { error: profileErr } = await appDb()
    .from("user_profiles")
    .upsert(
      { id: userId, full_name: input.fullName, job_title: input.jobTitle },
      { onConflict: "id" },
    );
  if (profileErr) throw new Error(profileErr.message);

  const { error: memberErr } = await appDb()
    .from("organization_members")
    .upsert(
      { organization_id: input.organizationId, user_id: userId, role: input.role },
      { onConflict: "organization_id,user_id" },
    );
  if (memberErr) throw new Error(memberErr.message);

  return { userId: userId!, tempPassword: password, existing };
}

export async function updateOrgUserImpl(input: {
  organizationId: string;
  userId: string;
  fullName: string;
  jobTitle: string | null;
  role: Role;
}): Promise<{ ok: true }> {
  const { error: profileErr } = await appDb()
    .from("user_profiles")
    .upsert(
      { id: input.userId, full_name: input.fullName, job_title: input.jobTitle },
      { onConflict: "id" },
    );
  if (profileErr) throw new Error(profileErr.message);

  const { error: memberErr } = await appDb()
    .from("organization_members")
    .upsert(
      { organization_id: input.organizationId, user_id: input.userId, role: input.role },
      { onConflict: "organization_id,user_id" },
    );
  if (memberErr) throw new Error(memberErr.message);

  return { ok: true };
}

export async function removeOrgUserImpl(input: {
  organizationId: string;
  userId: string;
}): Promise<{ ok: true }> {
  const { error } = await appDb()
    .from("organization_members")
    .delete()
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.userId);
  if (error) throw new Error(error.message);
  return { ok: true };
}
