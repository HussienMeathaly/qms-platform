import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  useActiveOrganizations,
  useCreateAssessment,
  useOrganizationMembers,
  usePublishedFrameworkVersions,
} from "./hooks";
import { friendlyAssessmentError } from "./service";

export function NewAssessmentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (responsesCreated: number) => void;
}) {
  const [organizationId, setOrganizationId] = useState("");
  const [frameworkVersionId, setFrameworkVersionId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const orgs = useActiveOrganizations(open);
  const versions = usePublishedFrameworkVersions(open);
  const members = useOrganizationMembers(organizationId, open);
  const create = useCreateAssessment();

  useEffect(() => {
    if (open) {
      setOrganizationId("");
      setFrameworkVersionId("");
      setAssignedTo("");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const canSubmit =
    Boolean(organizationId) && Boolean(frameworkVersionId) && Boolean(assignedTo) && !create.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) return;
    try {
      const result = await create.mutateAsync({ organizationId, frameworkVersionId, assignedTo });
      onCreated(result.responses_created);
      onOpenChange(false);
    } catch (err) {
      setError(friendlyAssessmentError(err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={() => !create.isPending && onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New Assessment"
        className="relative w-full max-w-lg rounded-lg border border-border bg-card p-5 shadow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">New Assessment</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="a-org" className="mb-1 block text-sm font-medium text-foreground">
              Organization
            </label>
            <select
              id="a-org"
              value={organizationId}
              onChange={(e) => {
                setOrganizationId(e.target.value);
                setAssignedTo("");
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select an organization</option>
              {(orgs.data ?? []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} — {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="a-version" className="mb-1 block text-sm font-medium text-foreground">
              Framework Version
            </label>
            <select
              id="a-version"
              value={frameworkVersionId}
              onChange={(e) => setFrameworkVersionId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select a framework version</option>
              {(versions.data ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.framework_code} — {v.version_number} — {v.version_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="a-user" className="mb-1 block text-sm font-medium text-foreground">
              Assigned User
            </label>
            <select
              id="a-user"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              disabled={!organizationId || members.isLoading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">
                {organizationId ? "Select a user" : "Select an organization first"}
              </option>
              {(members.data ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                  {m.job_title ? ` — ${m.job_title}` : ""}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {create.isPending ? "Creating…" : "Create Assessment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}