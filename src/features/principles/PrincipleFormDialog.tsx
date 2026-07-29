import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type {
  Principle,
  PrincipleCreateInput,
  PrincipleUpdateInput,
} from "./types";
import {
  useCreatePrinciple,
  useLevelOptions,
  useUpdatePrinciple,
} from "./hooks";
import { friendlyPrincipleError } from "./service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  principle?: Principle | null;
};

type FieldErrors = {
  level_id?: string;
  code?: string;
  display_name?: string;
  sort_order?: string;
};

export function PrincipleFormDialog({ open, onOpenChange, principle }: Props) {
  const isEdit = Boolean(principle);

  const [levelId, setLevelId] = useState("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState<string>("1");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const levels = useLevelOptions(open);
  const createMut = useCreatePrinciple();
  const updateMut = useUpdatePrinciple();
  const submitting = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (open) {
      setLevelId(principle?.level_id ?? "");
      setCode(principle?.code ?? "");
      setDisplayName(principle?.display_name ?? "");
      setDescription(principle?.description ?? "");
      setSortOrder(principle?.sort_order != null ? String(principle.sort_order) : "1");
      setErrors({});
      setSubmitError(null);
    }
  }, [open, principle]);

  // If editing a Principle whose current Level belongs to an archived version (excluded from the list), keep it visible.
  const levelOptions = useMemo(() => {
    const list = levels.data ?? [];
    if (principle?.level && !list.some((l) => l.id === principle.level!.id)) {
      const lv = principle.level;
      const fv = lv.framework_version;
      return [
        {
          id: lv.id,
          code: lv.code,
          display_name: lv.display_name,
          sort_order: lv.sort_order,
          framework_version_id: fv?.id ?? "",
          framework_version_number: fv?.version_number ?? "",
          framework_version_name: fv?.version_name ?? "",
          framework_version_status: fv?.status ?? "archived",
          framework_code: fv?.framework?.code ?? "",
          framework_name: fv?.framework?.name ?? "",
        },
        ...list,
      ];
    }
    return list;
  }, [levels.data, principle]);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!levelId) next.level_id = "Level is required.";
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
      level_id: levelId,
      code: code.trim(),
      display_name: displayName.trim(),
      description: description.trim() ? description.trim() : null,
      sort_order: Number(sortOrder),
    };
    try {
      if (isEdit && principle) {
        await updateMut.mutateAsync({ id: principle.id, input: base as PrincipleUpdateInput });
        toast.success("Principle updated");
      } else {
        await createMut.mutateAsync(base as PrincipleCreateInput);
        toast.success("Principle created");
      }
      onOpenChange(false);
    } catch (err) {
      setSubmitError(friendlyPrincipleError(err));
    }
  }

  if (!open) return null;

  const title = isEdit ? "Edit principle" : "New principle";
  const subtitle = isEdit
    ? "Update the principle details."
    : "Add a new principle under a Level.";

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
        aria-labelledby="pr-form-title"
        className="relative z-10 w-full max-w-lg rounded-lg border border-border bg-background shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="pr-form-title" className="text-base font-semibold text-foreground">
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
            <label htmlFor="pr-level" className="text-sm font-medium text-foreground">
              Level <span className="text-destructive">*</span>
            </label>
            <select
              id="pr-level"
              value={levelId}
              onChange={(e) => setLevelId(e.target.value)}
              disabled={submitting || levels.isLoading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              aria-invalid={Boolean(errors.level_id)}
            >
              <option value="">
                {levels.isLoading ? "Loading levels…" : "Select a level"}
              </option>
              {levelOptions.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.framework_code || "—"} — Version {l.framework_version_number} — {l.code} {l.display_name}
                  {l.framework_version_status === "archived" ? " (Archived)" : ""}
                </option>
              ))}
            </select>
            {errors.level_id && (
              <p className="text-xs text-destructive">{errors.level_id}</p>
            )}
            {levels.isError && (
              <p className="text-xs text-destructive">
                Couldn't load levels. Try closing and reopening this dialog.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="pr-code" className="text-sm font-medium text-foreground">
                Code <span className="text-destructive">*</span>
              </label>
              <input
                id="pr-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={submitting}
                autoComplete="off"
                placeholder="e.g. P1"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
                aria-invalid={Boolean(errors.code)}
              />
              {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="pr-name" className="text-sm font-medium text-foreground">
                Display Name <span className="text-destructive">*</span>
              </label>
              <input
                id="pr-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={submitting}
                placeholder="e.g. Ownership"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
                aria-invalid={Boolean(errors.display_name)}
              />
              {errors.display_name && (
                <p className="text-xs text-destructive">{errors.display_name}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pr-desc" className="text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="pr-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              rows={3}
              placeholder="Optional description of this principle"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
            />
          </div>

          <div className="space-y-1.5 sm:max-w-[12rem]">
            <label htmlFor="pr-order" className="text-sm font-medium text-foreground">
              Sort Order <span className="text-destructive">*</span>
            </label>
            <input
              id="pr-order"
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
            {errors.sort_order && (
              <p className="text-xs text-destructive">{errors.sort_order}</p>
            )}
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
              {isEdit ? "Save changes" : "Create principle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}