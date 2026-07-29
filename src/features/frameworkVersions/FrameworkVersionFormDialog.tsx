import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type {
  FrameworkVersion,
  FrameworkVersionCreateInput,
  FrameworkVersionUpdateInput,
} from "./types";
import {
  useActiveFrameworks,
  useCreateFrameworkVersion,
  useUpdateFrameworkVersion,
} from "./hooks";
import { friendlyFrameworkVersionError } from "./service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version?: FrameworkVersion | null;
};

type FieldErrors = {
  framework_id?: string;
  version_number?: string;
  version_name?: string;
  effective_to?: string;
};

export function FrameworkVersionFormDialog({ open, onOpenChange, version }: Props) {
  const isEdit = Boolean(version);
  const readOnly = version?.status === "published" || version?.status === "archived";

  const [frameworkId, setFrameworkId] = useState("");
  const [versionNumber, setVersionNumber] = useState("");
  const [versionName, setVersionName] = useState("");
  const [description, setDescription] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const frameworks = useActiveFrameworks(open);
  const createMut = useCreateFrameworkVersion();
  const updateMut = useUpdateFrameworkVersion();
  const submitting = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (open) {
      setFrameworkId(version?.framework_id ?? "");
      setVersionNumber(version?.version_number ?? "");
      setVersionName(version?.version_name ?? "");
      setDescription(version?.description ?? "");
      setEffectiveFrom(version?.effective_from ?? "");
      setEffectiveTo(version?.effective_to ?? "");
      setErrors({});
      setSubmitError(null);
    }
  }, [open, version]);

  // If editing a draft whose current framework is inactive, ensure it appears in the list.
  const frameworkOptions = useMemo(() => {
    const list = frameworks.data ?? [];
    if (version?.framework && !list.some((f) => f.id === version.framework!.id)) {
      return [version.framework, ...list];
    }
    return list;
  }, [frameworks.data, version]);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!frameworkId) next.framework_id = "Framework is required.";
    if (!versionNumber.trim()) next.version_number = "Version Number is required.";
    else if (versionNumber.trim().length > 32)
      next.version_number = "Version Number must be 32 characters or fewer.";
    if (!versionName.trim()) next.version_name = "Version Name is required.";
    else if (versionName.trim().length > 255)
      next.version_name = "Version Name must be 255 characters or fewer.";
    if (effectiveFrom && effectiveTo && effectiveTo < effectiveFrom) {
      next.effective_to = "Effective To cannot be earlier than Effective From.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setSubmitError(null);
    if (!validate()) return;
    const base = {
      framework_id: frameworkId,
      version_number: versionNumber.trim(),
      version_name: versionName.trim(),
      description: description.trim() ? description.trim() : null,
      effective_from: effectiveFrom || null,
      effective_to: effectiveTo || null,
    };
    try {
      if (isEdit && version) {
        await updateMut.mutateAsync({ id: version.id, input: base as FrameworkVersionUpdateInput });
        toast.success("Version updated");
      } else {
        await createMut.mutateAsync(base as FrameworkVersionCreateInput);
        toast.success("Version created");
      }
      onOpenChange(false);
    } catch (err) {
      setSubmitError(friendlyFrameworkVersionError(err));
    }
  }

  if (!open) return null;

  const title = isEdit
    ? readOnly
      ? "View version"
      : "Edit version"
    : "New version";
  const subtitle = isEdit
    ? readOnly
      ? `This ${version?.status} version is read-only.`
      : "Update the draft version details."
    : "Add a new version to a framework.";

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
        aria-labelledby="fv-form-title"
        className="relative z-10 w-full max-w-lg rounded-lg border border-border bg-background shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="fv-form-title" className="text-base font-semibold text-foreground">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
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
            <label htmlFor="fv-framework" className="text-sm font-medium text-foreground">
              Framework <span className="text-destructive">*</span>
            </label>
            <select
              id="fv-framework"
              value={frameworkId}
              onChange={(e) => setFrameworkId(e.target.value)}
              disabled={submitting || readOnly || frameworks.isLoading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              aria-invalid={Boolean(errors.framework_id)}
            >
              <option value="">
                {frameworks.isLoading ? "Loading frameworks…" : "Select a framework"}
              </option>
              {frameworkOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code} — {f.name}
                </option>
              ))}
            </select>
            {errors.framework_id && (
              <p className="text-xs text-destructive">{errors.framework_id}</p>
            )}
            {frameworks.isError && (
              <p className="text-xs text-destructive">
                Couldn't load frameworks. Try closing and reopening this dialog.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="fv-number" className="text-sm font-medium text-foreground">
                Version Number <span className="text-destructive">*</span>
              </label>
              <input
                id="fv-number"
                value={versionNumber}
                onChange={(e) => setVersionNumber(e.target.value)}
                disabled={submitting || readOnly}
                autoComplete="off"
                placeholder="e.g. 1.0"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
                aria-invalid={Boolean(errors.version_number)}
              />
              {errors.version_number && (
                <p className="text-xs text-destructive">{errors.version_number}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="fv-name" className="text-sm font-medium text-foreground">
                Version Name <span className="text-destructive">*</span>
              </label>
              <input
                id="fv-name"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                disabled={submitting || readOnly}
                placeholder="Initial Release"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
                aria-invalid={Boolean(errors.version_name)}
              />
              {errors.version_name && (
                <p className="text-xs text-destructive">{errors.version_name}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="fv-desc" className="text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="fv-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting || readOnly}
              rows={3}
              placeholder="What changed in this version"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="fv-from" className="text-sm font-medium text-foreground">
                Effective From
              </label>
              <input
                id="fv-from"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                disabled={submitting || readOnly}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="fv-to" className="text-sm font-medium text-foreground">
                Effective To
              </label>
              <input
                id="fv-to"
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
                disabled={submitting || readOnly}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
                aria-invalid={Boolean(errors.effective_to)}
              />
              {errors.effective_to && (
                <p className="text-xs text-destructive">{errors.effective_to}</p>
              )}
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
              {readOnly ? "Close" : "Cancel"}
            </button>
            {!readOnly && (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEdit ? "Save changes" : "Create version"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}