import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type {
  FrameworkVersionOption,
  ProcessClause,
  ProcessClauseCreateInput,
  ProcessClauseUpdateInput,
} from "./types";
import {
  useCreateProcessClause,
  useFrameworkVersionOptions,
  useUpdateProcessClause,
} from "./hooks";
import { friendlyProcessClauseError } from "./service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clause?: ProcessClause | null;
};

type FieldErrors = {
  framework_version_id?: string;
  code?: string;
  display_name?: string;
  sort_order?: string;
};

function optionLabel(v: FrameworkVersionOption): string {
  const fw = [v.framework_code, v.framework_name].filter(Boolean).join(" / ");
  const version = [v.version_number, v.version_name].filter(Boolean).join(" / ");
  const archived = v.status === "archived" ? " (Archived)" : "";
  return `${fw || "—"} → ${version || "—"}${archived}`;
}

export function ProcessClauseFormDialog({ open, onOpenChange, clause }: Props) {
  const isEdit = Boolean(clause);

  const [versionId, setVersionId] = useState("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState<string>("1");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const versions = useFrameworkVersionOptions(open);
  const createMut = useCreateProcessClause();
  const updateMut = useUpdateProcessClause();
  const submitting = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (open) {
      setVersionId(clause?.framework_version_id ?? "");
      setCode(clause?.code ?? "");
      setDisplayName(clause?.display_name ?? "");
      setDescription(clause?.description ?? "");
      setSortOrder(clause?.sort_order != null ? String(clause.sort_order) : "1");
      setErrors({});
      setSubmitError(null);
    }
  }, [open, clause]);

  // Keep the currently assigned Framework Version visible when editing a Process
  // Clause whose version is archived (archived versions are excluded from the list).
  const versionOptions = useMemo<FrameworkVersionOption[]>(() => {
    const list = versions.data ?? [];
    const current = clause?.framework_version;
    if (current && !list.some((v) => v.id === current.id)) {
      return [
        {
          id: current.id,
          version_number: current.version_number,
          version_name: current.version_name,
          status: current.status,
          framework_code: current.framework?.code ?? "",
          framework_name: current.framework?.name ?? "",
        },
        ...list,
      ];
    }
    return list;
  }, [versions.data, clause]);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!versionId) next.framework_version_id = "Framework Version is required.";
    if (!code.trim()) next.code = "Code is required.";
    else if (code.trim().length > 32) next.code = "Code must be 32 characters or fewer.";
    if (!displayName.trim()) next.display_name = "Display Name is required.";
    else if (displayName.trim().length > 255)
      next.display_name = "Display Name must be 255 characters or fewer.";
    const parsed = Number(sortOrder);
    if (sortOrder === "" || !Number.isFinite(parsed)) {
      next.sort_order = "Sort Order is required.";
    } else if (!Number.isInteger(parsed) || parsed < 1) {
      next.sort_order = "Sort Order must be a whole number greater than or equal to 1.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    const base = {
      framework_version_id: versionId,
      code: code.trim(),
      display_name: displayName.trim(),
      description: description.trim() ? description.trim() : null,
      sort_order: Number(sortOrder),
    };
    try {
      if (isEdit && clause) {
        await updateMut.mutateAsync({ id: clause.id, input: base as ProcessClauseUpdateInput });
        toast.success("Process Clause updated");
      } else {
        await createMut.mutateAsync(base as ProcessClauseCreateInput);
        toast.success("Process Clause created");
      }
      onOpenChange(false);
    } catch (err) {
      // Dialog stays open so the user can correct the values.
      setSubmitError(friendlyProcessClauseError(err));
    }
  }

  if (!open) return null;

  const heading = isEdit ? "Edit process clause" : "New process clause";
  const subtitle = isEdit
    ? "Update the process clause details."
    : "Add a new process clause under a Framework Version.";

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
        aria-labelledby="pc-form-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-background shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="pc-form-title" className="text-base font-semibold text-foreground">
              {heading}
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
            <label htmlFor="pc-version" className="text-sm font-medium text-foreground">
              Framework Version <span className="text-destructive">*</span>
            </label>
            <select
              id="pc-version"
              value={versionId}
              onChange={(e) => setVersionId(e.target.value)}
              disabled={submitting || versions.isLoading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              aria-invalid={Boolean(errors.framework_version_id)}
            >
              <option value="">
                {versions.isLoading ? "Loading framework versions…" : "Select a framework version"}
              </option>
              {versionOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {optionLabel(v)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Framework Code / Framework Name → Version Number / Version Name
            </p>
            {errors.framework_version_id && (
              <p className="text-xs text-destructive">{errors.framework_version_id}</p>
            )}
            {versions.isError && (
              <p className="text-xs text-destructive">
                Couldn't load framework versions. Try closing and reopening this dialog.
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:max-w-[12rem]">
            <label htmlFor="pc-code" className="text-sm font-medium text-foreground">
              Code <span className="text-destructive">*</span>
            </label>
            <input
              id="pc-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={submitting}
              autoComplete="off"
              maxLength={32}
              placeholder="e.g. PC1"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              aria-invalid={Boolean(errors.code)}
            />
            {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pc-name" className="text-sm font-medium text-foreground">
              Display Name <span className="text-destructive">*</span>
            </label>
            <input
              id="pc-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={submitting}
              maxLength={255}
              placeholder="e.g. Governance and Oversight"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              aria-invalid={Boolean(errors.display_name)}
            />
            {errors.display_name && (
              <p className="text-xs text-destructive">{errors.display_name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pc-description" className="text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="pc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              rows={3}
              placeholder="Optional description"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
            />
          </div>

          <div className="space-y-1.5 sm:max-w-[12rem]">
            <label htmlFor="pc-order" className="text-sm font-medium text-foreground">
              Sort Order <span className="text-destructive">*</span>
            </label>
            <input
              id="pc-order"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              disabled={submitting}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              aria-invalid={Boolean(errors.sort_order)}
            />
            {errors.sort_order && <p className="text-xs text-destructive">{errors.sort_order}</p>}
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
              {isEdit ? "Save changes" : "Create clause"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}