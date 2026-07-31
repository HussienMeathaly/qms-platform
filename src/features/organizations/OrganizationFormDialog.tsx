import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Building2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { Organization, OrganizationInput, OrganizationStatus } from "./types";
import { useCreateOrganization, useUpdateOrganization } from "./hooks";
import { friendlyOrganizationError } from "./service";
import { ORGANIZATION_ROLES, type OrganizationRole } from "./membersService";
import { createOrgUser } from "@/lib/orgUsers.functions";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization?: Organization | null;
};

type FieldErrors = Partial<Record<"name" | "fullName" | "email", string>>;

function slugCode(name: string): string {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return base || "ORG";
}

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60";

export function OrganizationFormDialog({ open, onOpenChange, organization }: Props) {
  const isEdit = Boolean(organization);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<OrganizationStatus>("active");

  const [withContact, setWithContact] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrganizationRole>("org_admin");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);

  const createMut = useCreateOrganization();
  const updateMut = useUpdateOrganization();
  const submitting = createMut.isPending || updateMut.isPending || creatingUser;

  useEffect(() => {
    if (!open) return;
    setName(organization?.name ?? "");
    setStatus(organization?.status ?? "active");
    setWithContact(true);
    setFullName("");
    setEmail("");
    setRole("org_admin");
    setErrors({});
    setSubmitError(null);
  }, [open, organization]);

  const previewCode = useMemo(() => slugCode(name), [name]);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Organization name is required.";
    else if (name.trim().length > 255) next.name = "Keep the name under 255 characters.";

    if (!isEdit && withContact) {
      if (!fullName.trim()) next.fullName = "Contact name is required.";
      if (!email.trim()) next.email = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email address.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    try {
      if (isEdit && organization) {
        await updateMut.mutateAsync({
          id: organization.id,
          input: { code: organization.code, name: name.trim(), status },
        });
        toast.success("Organization updated");
        onOpenChange(false);
        return;
      }

      // Auto-generate a unique code from the name (hidden from the user).
      let created: Organization | null = null;
      let attempt = 0;
      while (!created) {
        const code = attempt === 0 ? previewCode : `${previewCode}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const input: OrganizationInput = { code, name: name.trim(), status };
        try {
          created = await createMut.mutateAsync(input);
        } catch (err) {
          const code2 = (err as { code?: string } | null)?.code ?? "";
          const msg = err instanceof Error ? err.message : "";
          if ((code2 === "23505" || /duplicate key|unique/i.test(msg)) && attempt < 4) {
            attempt += 1;
            continue;
          }
          throw err;
        }
      }

      if (withContact) {
        setCreatingUser(true);
        try {
          const res = await createOrgUser({
            data: {
              organizationId: created.id,
              email: email.trim(),
              fullName: fullName.trim(),
              jobTitle: null,
              role,
            },
          });
          if (res.tempPassword) {
            toast.success("Organization and user created", {
              description: `Temporary password for ${email.trim()}: ${res.tempPassword}`,
              duration: 15000,
            });
          } else {
            toast.success("Organization created and existing user linked");
          }
        } finally {
          setCreatingUser(false);
        }
      } else {
        toast.success("Organization created");
      }

      onOpenChange(false);
    } catch (err) {
      setSubmitError(friendlyOrganizationError(err));
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8">
      <div
        className="fixed inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={() => !submitting && onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="org-form-title"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/40 px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 id="org-form-title" className="text-base font-semibold text-foreground">
                {isEdit ? "Edit organization" : "New organization"}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isEdit
                  ? "Update the organization details."
                  : "Add the organization and its main contact in one step."}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => !submitting && onOpenChange(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-5">
          <section className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="org-name" className="text-sm font-medium text-foreground">
                Organization name <span className="text-destructive">*</span>
              </label>
              <input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                autoFocus
                className={inputClass}
                placeholder="e.g. Al Birr Charitable Society"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "org-name-error" : "org-name-hint"}
              />
              {errors.name ? (
                <p id="org-name-error" className="text-xs text-destructive">{errors.name}</p>
              ) : (
                !isEdit && (
                  <p id="org-name-hint" className="text-xs text-muted-foreground">
                    Reference code is generated automatically{name.trim() ? `: ${previewCode}` : ""}.
                  </p>
                )
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">Status</span>
              <div className="inline-flex rounded-lg border border-input p-0.5">
                {(["active", "inactive"] as OrganizationStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    disabled={submitting}
                    aria-pressed={status === s}
                    className={cn(
                      "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                      status === s
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s === "active" ? "Active" : "Inactive"}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {!isEdit && (
            <section className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={withContact}
                  onChange={(e) => setWithContact(e.target.checked)}
                  disabled={submitting}
                  className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">Add main contact</span>
                  <span className="block text-xs text-muted-foreground">
                    Creates an account and links it to this organization.
                  </span>
                </span>
              </label>

              {withContact && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="u-name" className="text-xs font-medium text-foreground">
                      Full name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="u-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={submitting}
                      className={inputClass}
                      placeholder="Sara Al-Ahmad"
                      aria-invalid={Boolean(errors.fullName)}
                    />
                    {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="u-email" className="text-xs font-medium text-foreground">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="u-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={submitting}
                      className={inputClass}
                      placeholder="sara@example.org"
                      aria-invalid={Boolean(errors.email)}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="u-role" className="text-xs font-medium text-foreground">
                      Role
                    </label>
                    <select
                      id="u-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as OrganizationRole)}
                      disabled={submitting}
                      className={inputClass}
                    >
                      {ORGANIZATION_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </section>
          )}

          {submitError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
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
