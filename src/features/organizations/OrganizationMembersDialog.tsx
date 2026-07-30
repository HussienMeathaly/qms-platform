import { useMemo, useState } from "react";
import { AlertCircle, Loader2, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { Organization } from "./types";
import { friendlyOrganizationError } from "./service";
import { ORGANIZATION_ROLES, type OrganizationRole } from "./membersService";
import {
  useAddMember,
  useOrganizationMembers,
  useRemoveMember,
  useUpdateMemberRole,
  useUserProfiles,
} from "./membersHooks";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
};

export function OrganizationMembersDialog({ open, onOpenChange, organization }: Props) {
  const orgId = open && organization ? organization.id : null;
  const membersQuery = useOrganizationMembers(orgId);
  const profilesQuery = useUserProfiles(Boolean(orgId));

  const addMut = useAddMember(orgId);
  const roleMut = useUpdateMemberRole(orgId);
  const removeMut = useRemoveMember(orgId);

  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState<OrganizationRole>("org_contributor");
  const [confirmUserId, setConfirmUserId] = useState<string | null>(null);

  const members = membersQuery.data ?? [];
  const memberIds = useMemo(() => new Set(members.map((m) => m.user_id)), [members]);
  const availableUsers = (profilesQuery.data ?? []).filter((u) => !memberIds.has(u.id));

  if (!open || !organization) return null;

  async function handleAdd() {
    if (!selectedUser) return;
    try {
      await addMut.mutateAsync({ userId: selectedUser, role: selectedRole });
      setSelectedUser("");
      toast.success("Member added successfully.");
    } catch (err) {
      toast.error(friendlyOrganizationError(err));
    }
  }

  async function handleRoleChange(userId: string, role: OrganizationRole) {
    try {
      await roleMut.mutateAsync({ userId, role });
      toast.success("Member role updated successfully.");
    } catch (err) {
      toast.error(friendlyOrganizationError(err));
    }
  }

  async function handleRemove(userId: string) {
    try {
      await removeMut.mutateAsync(userId);
      setConfirmUserId(null);
      toast.success("Member removed successfully.");
    } catch (err) {
      toast.error(friendlyOrganizationError(err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={() => onOpenChange(false)} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="org-members-title"
        className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-background shadow-lg"
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="org-members-title" className="text-base font-semibold text-foreground">
              Manage Members
            </h2>
            <p className="text-xs text-muted-foreground">{organization.name}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 px-5 py-4">
          <section className="rounded-md border border-border">
            <div className="hidden grid-cols-12 gap-3 border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
              <div className="col-span-4">Full Name</div>
              <div className="col-span-3">Job Title</div>
              <div className="col-span-4">Organization Role</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {membersQuery.isLoading ? (
              <div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading members…
              </div>
            ) : membersQuery.isError ? (
              <div className="flex items-start gap-3 px-3 py-4">
                <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Couldn't load members</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {friendlyOrganizationError(membersQuery.error)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => membersQuery.refetch()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </div>
            ) : members.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No members yet.
              </p>
            ) : (
              <ul role="list" className="divide-y divide-border">
                {members.map((m) => (
                  <li key={m.user_id} className="grid grid-cols-12 items-center gap-3 px-3 py-2.5 text-sm">
                    <div className="col-span-9 truncate font-medium text-foreground sm:col-span-4">
                      {m.full_name}
                    </div>
                    <div className="col-span-3 hidden truncate text-muted-foreground sm:block">
                      {m.job_title ?? "—"}
                    </div>
                    <div className="col-span-9 sm:col-span-4">
                      <select
                        value={m.role}
                        aria-label={`Role for ${m.full_name}`}
                        onChange={(e) => handleRoleChange(m.user_id, e.target.value as OrganizationRole)}
                        disabled={roleMut.isPending}
                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                      >
                        {ORGANIZATION_ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3 flex justify-end sm:col-span-1">
                      <button
                        type="button"
                        onClick={() => setConfirmUserId(m.user_id)}
                        aria-label={`Remove ${m.full_name}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3 rounded-md border border-border p-3">
            <h3 className="text-sm font-semibold text-foreground">Add Member</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="member-user" className="text-sm font-medium text-foreground">
                  User <span className="text-destructive">*</span>
                </label>
                <select
                  id="member-user"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  disabled={profilesQuery.isLoading || addMut.isPending}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  <option value="">Select a user…</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name}{u.job_title ? ` — ${u.job_title}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="member-role" className="text-sm font-medium text-foreground">
                  Organization Role <span className="text-destructive">*</span>
                </label>
                <select
                  id="member-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as OrganizationRole)}
                  disabled={addMut.isPending}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  {ORGANIZATION_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAdd}
                disabled={!selectedUser || addMut.isPending}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {addMut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Add Member
              </button>
            </div>
          </section>
        </div>
      </div>

      {confirmUserId && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-foreground/40" aria-hidden="true" />
          <div
            role="alertdialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-sm rounded-lg border border-border bg-background p-5 shadow-lg"
          >
            <p className="text-sm font-medium text-foreground">
              Remove this member from the organization?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmUserId(null)}
                disabled={removeMut.isPending}
                className="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRemove(confirmUserId)}
                disabled={removeMut.isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
              >
                {removeMut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}