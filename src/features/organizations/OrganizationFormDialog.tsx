import { useEffect, useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { Organization, OrganizationInput, OrganizationStatus } from "./types";
import { useCreateOrganization, useUpdateOrganization } from "./hooks";
import { friendlyOrganizationError } from "./service";
import { useUserProfiles } from "./membersHooks";
import { addMember, ORGANIZATION_ROLES, type OrganizationRole } from "./membersService";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization?: Organization | null;
};

const STATUSES: OrganizationStatus[] = ["active", "inactive"];

export function OrganizationFormDialog({ open, onOpenChange, organization }: Props) {
  const isEdit = Boolean(organization);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<OrganizationStatus>("active");
  const [assessorId, setAssessorId] = useState("");
  const [assessorRole, setAssessorRole] = useState<OrganizationRole>("org_admin");
  const [errors, setErrors] = useState<Partial<Record<keyof OrganizationInput, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMut = useCreateOrganization();
  const updateMut = useUpdateOrganization();
  const submitting = createMut.isPending || updateMut.isPending;
  const profilesQuery = useUserProfiles(open && !isEdit);

  useEffect(() => {
    if (open) {
      setCode(organization?.code ?? "");
      setName(organization?.name ?? "");
      setStatus(organization?.status ?? "active");
      setAssessorId("");
      setAssessorRole("org_admin");
      setErrors({});
      setSubmitError(null);
    }
  }, [open, organization]);

  function validate(): boolean {
    const next: Partial<Record<keyof OrganizationInput, string>> = {};
    if (!code.trim()) next.code = "Code is required.";
    else if (code.trim().length > 64) next.code = "Code must be 64 characters or fewer.";
    if (!name.trim()) next.name = "Name is required.";
    else if (name.trim().length > 255) next.name = "Name must be 255 characters or fewer.";
    if (!STATUSES.includes(status)) next.status = "Select a valid status.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    const input: OrganizationInput = { code: code.trim(), name: name.trim(), status };
    try {
      if (isEdit && organization) {
        await updateMut.mutateAsync({ id: organization.id, input });
        toast.success("Organization updated");
      } else {
        const created = await createMut.mutateAsync(input);
        if (assessorId) {
          await addMember({
            organizationId: created.id,
            userId: assessorId,
            role: assessorRole,
          });
          toast.success("Organization created with assigned user");
        } else {
          toast.success("Organization created");
        }
      }
      onOpenChange(false);
    } catch (err) {
      setSubmitError(friendlyOrganizationError(err));
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-foreground/40"
        onClick={() => !submitting && onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="org-form-title"
        className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="org-form-title" className="text-base font-semibold text-foreground">
              {isEdit ? "Edit organization" : "New organization"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isEdit ? "Update the organization details." : "Add a new organization to the platform."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => !submitting && onOpenChange(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="space-y-1.5">
            <label htmlFor="org-code" className="text-sm font-medium text-foreground">
              Code <span className="text-destructive">*</span>
            </label>
            <input
              id="org-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={submitting}
              autoComplete="off"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              placeholder="e.g. ACME"
              aria-invalid={Boolean(errors.code)}
              aria-describedby={errors.code ? "org-code-error" : undefined}
            />
            {errors.code && (
              <p id="org-code-error" className="text-xs text-destructive">{errors.code}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="org-name" className="text-sm font-medium text-foreground">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              placeholder="Acme Foundation"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "org-name-error" : undefined}
            />
            {errors.name && (
              <p id="org-name-error" className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="org-status" className="text-sm font-medium text-foreground">
              Status <span className="text-destructive">*</span>
            </label>
            <select
              id="org-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrganizationStatus)}
              disabled={submitting}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s === "active" ? "Active" : "Inactive"}</option>
              ))}
            </select>
          </div>

          {submitError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {submitError}
            </div>
          )}

          {!isEdit && (
            <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Assigned user</p>
                <p className="text-xs text-muted-foreground">
                  Optional — the person who will complete the assessment for this organization.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="org-assessor" className="text-xs font-medium text-foreground">
                  User
                </label>
                <select
                  id="org-assessor"
                  value={assessorId}
                  onChange={(e) => setAssessorId(e.target.value)}
                  disabled={submitting || profilesQuery.isLoading}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  <option value="">
                    {profilesQuery.isLoading ? "Loading users…" : "No user assigned"}
                  </option>
                  {(profilesQuery.data ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                      {p.job_title ? ` — ${p.job_title}` : ""}
                    </option>
                  ))}
                </select>
                {profilesQuery.isError && (
                  <p className="text-xs text-destructive">Unable to load users.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="org-assessor-role" className="text-xs font-medium text-foreground">
                  Role
                </label>
                <select
                  id="org-assessor-role"
                  value={assessorRole}
                  onChange={(e) => setAssessorRole(e.target.value as OrganizationRole)}
                  disabled={submitting || !assessorId}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  {ORGANIZATION_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEdit ? "Save changes" : "Create organization"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}