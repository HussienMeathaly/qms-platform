import { useEffect, useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { Framework, FrameworkInput, FrameworkStatus } from "./types";
import { useCreateFramework, useUpdateFramework } from "./hooks";
import { friendlyFrameworkError } from "./service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  framework?: Framework | null;
};

const STATUSES: FrameworkStatus[] = ["draft", "published", "archived"];

function statusLabel(s: FrameworkStatus): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function FrameworkFormDialog({ open, onOpenChange, framework }: Props) {
  const isEdit = Boolean(framework);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<FrameworkStatus>("draft");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [errors, setErrors] = useState<Partial<Record<keyof FrameworkInput, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMut = useCreateFramework();
  const updateMut = useUpdateFramework();
  const submitting = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (open) {
      setCode(framework?.code ?? "");
      setName(framework?.name ?? "");
      setDescription(framework?.description ?? "");
      setStatus(framework?.status ?? "draft");
      setIsActive(framework?.is_active ?? true);
      setErrors({});
      setSubmitError(null);
    }
  }, [open, framework]);

  function validate(): boolean {
    const next: Partial<Record<keyof FrameworkInput, string>> = {};
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
    const input: FrameworkInput = {
      code: code.trim(),
      name: name.trim(),
      description: description.trim() ? description.trim() : null,
      status,
      is_active: isActive,
    };
    try {
      if (isEdit && framework) {
        await updateMut.mutateAsync({ id: framework.id, input });
        toast.success("Framework updated");
      } else {
        await createMut.mutateAsync(input);
        toast.success("Framework created");
      }
      onOpenChange(false);
    } catch (err) {
      setSubmitError(friendlyFrameworkError(err));
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
        aria-labelledby="fw-form-title"
        className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="fw-form-title" className="text-base font-semibold text-foreground">
              {isEdit ? "Edit framework" : "New framework"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isEdit ? "Update the framework details." : "Add a new assessment framework."}
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
            <label htmlFor="fw-code" className="text-sm font-medium text-foreground">
              Framework Code <span className="text-destructive">*</span>
            </label>
            <input
              id="fw-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={submitting}
              autoComplete="off"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              placeholder="e.g. DER-V1"
              aria-invalid={Boolean(errors.code)}
              aria-describedby={errors.code ? "fw-code-error" : undefined}
            />
            {errors.code && (
              <p id="fw-code-error" className="text-xs text-destructive">{errors.code}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="fw-name" className="text-sm font-medium text-foreground">
              Framework Name <span className="text-destructive">*</span>
            </label>
            <input
              id="fw-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              placeholder="Donor Effectiveness Requirements"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "fw-name-error" : undefined}
            />
            {errors.name && (
              <p id="fw-name-error" className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="fw-description" className="text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="fw-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              placeholder="Short summary of the framework's purpose"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="fw-status" className="text-sm font-medium text-foreground">
                Status <span className="text-destructive">*</span>
              </label>
              <select
                id="fw-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as FrameworkStatus)}
                disabled={submitting}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="fw-active" className="text-sm font-medium text-foreground">
                Active <span className="text-destructive">*</span>
              </label>
              <select
                id="fw-active"
                value={isActive ? "true" : "false"}
                onChange={(e) => setIsActive(e.target.value === "true")}
                disabled={submitting}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

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
              {isEdit ? "Save changes" : "Create framework"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}