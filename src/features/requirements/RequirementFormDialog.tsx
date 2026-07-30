import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type {
  PrincipleOption,
  Requirement,
  RequirementCreateInput,
  RequirementUpdateInput,
} from "./types";
import { useCreateRequirement, usePrincipleOptions, useUpdateRequirement } from "./hooks";
import { friendlyRequirementError } from "./service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement?: Requirement | null;
};

type FieldErrors = {
  principle_id?: string;
  code?: string;
  title?: string;
  sort_order?: string;
};

function optionLabel(p: PrincipleOption): string {
  const fw = [p.framework_code, p.framework_name].filter(Boolean).join(" / ");
  const version = [p.framework_version_number, p.framework_version_name]
    .filter(Boolean)
    .join(" / ");
  const level = [p.level_code, p.level_display_name].filter(Boolean).join(" / ");
  const principle = [p.code, p.display_name].filter(Boolean).join(" / ");
  const archived = p.framework_version_status === "archived" ? " (Archived)" : "";
  return `${fw || "—"} → ${version || "—"} → ${level || "—"} → ${principle}${archived}`;
}

export function RequirementFormDialog({ open, onOpenChange, requirement }: Props) {
  const isEdit = Boolean(requirement);

  const [principleId, setPrincipleId] = useState("");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [guidance, setGuidance] = useState("");
  const [sortOrder, setSortOrder] = useState<string>("1");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const principles = usePrincipleOptions(open);
  const createMut = useCreateRequirement();
  const updateMut = useUpdateRequirement();
  const submitting = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (open) {
      setPrincipleId(requirement?.principle_id ?? "");
      setCode(requirement?.code ?? "");
      setTitle(requirement?.title ?? "");
      setGuidance(requirement?.guidance ?? "");
      setSortOrder(requirement?.sort_order != null ? String(requirement.sort_order) : "1");
      setErrors({});
      setSubmitError(null);
    }
  }, [open, requirement]);

  // Keep the currently assigned Principle visible when editing a Requirement whose
  // parent Framework Version is archived (archived versions are excluded from the list).
  const principleOptions = useMemo<PrincipleOption[]>(() => {
    const list = principles.data ?? [];
    const current = requirement?.principle;
    if (current && !list.some((p) => p.id === current.id)) {
      const lv = current.level;
      const fv = lv?.framework_version;
      return [
        {
          id: current.id,
          code: current.code,
          display_name: current.display_name,
          sort_order: current.sort_order,
          level_code: lv?.code ?? "",
          level_display_name: lv?.display_name ?? "",
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
  }, [principles.data, requirement]);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!principleId) next.principle_id = "Principle is required.";
    if (!code.trim()) next.code = "Code is required.";
    else if (code.trim().length > 32) next.code = "Code must be 32 characters or fewer.";
    if (!title.trim()) next.title = "Title is required.";
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
      principle_id: principleId,
      code: code.trim(),
      title: title.trim(),
      guidance: guidance.trim() ? guidance.trim() : null,
      sort_order: Number(sortOrder),
    };
    try {
      if (isEdit && requirement) {
        await updateMut.mutateAsync({ id: requirement.id, input: base as RequirementUpdateInput });
        toast.success("Requirement updated");
      } else {
        await createMut.mutateAsync(base as RequirementCreateInput);
        toast.success("Requirement created");
      }
      onOpenChange(false);
    } catch (err) {
      // Dialog stays open so the user can correct the values.
      setSubmitError(friendlyRequirementError(err));
    }
  }

  if (!open) return null;

  const heading = isEdit ? "Edit requirement" : "New requirement";
  const subtitle = isEdit
    ? "Update the requirement details."
    : "Add a new requirement under a Principle.";

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
        aria-labelledby="req-form-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-background shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="req-form-title" className="text-base font-semibold text-foreground">
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
            <label htmlFor="req-principle" className="text-sm font-medium text-foreground">
              Principle <span className="text-destructive">*</span>
            </label>
            <select
              id="req-principle"
              value={principleId}
              onChange={(e) => setPrincipleId(e.target.value)}
              disabled={submitting || principles.isLoading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              aria-invalid={Boolean(errors.principle_id)}
            >
              <option value="">
                {principles.isLoading ? "Loading principles…" : "Select a principle"}
              </option>
              {principleOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {optionLabel(p)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Framework / Version / Level / Principle
            </p>
            {errors.principle_id && (
              <p className="text-xs text-destructive">{errors.principle_id}</p>
            )}
            {principles.isError && (
              <p className="text-xs text-destructive">
                Couldn't load principles. Try closing and reopening this dialog.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="req-code" className="text-sm font-medium text-foreground">
                Code <span className="text-destructive">*</span>
              </label>
              <input
                id="req-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={submitting}
                autoComplete="off"
                maxLength={32}
                placeholder="e.g. R1"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
                aria-invalid={Boolean(errors.code)}
              />
              {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="req-title" className="text-sm font-medium text-foreground">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                id="req-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                placeholder="e.g. Documented donor selection policy"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="req-guidance" className="text-sm font-medium text-foreground">
              Guidance
            </label>
            <textarea
              id="req-guidance"
              value={guidance}
              onChange={(e) => setGuidance(e.target.value)}
              disabled={submitting}
              rows={4}
              placeholder="Optional guidance for assessors"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
            />
          </div>

          <div className="space-y-1.5 sm:max-w-[12rem]">
            <label htmlFor="req-order" className="text-sm font-medium text-foreground">
              Sort Order <span className="text-destructive">*</span>
            </label>
            <input
              id="req-order"
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
              {isEdit ? "Save changes" : "Create requirement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}