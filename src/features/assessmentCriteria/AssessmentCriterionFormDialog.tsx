import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type {
  AssessmentCriterion,
  AssessmentCriterionCreateInput,
  AssessmentCriterionUpdateInput,
  RequirementOption,
} from "./types";
import {
  useCreateAssessmentCriterion,
  useRequirementOptions,
  useUpdateAssessmentCriterion,
} from "./hooks";
import { friendlyAssessmentCriterionError } from "./service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criterion?: AssessmentCriterion | null;
};

type FieldErrors = {
  requirement_id?: string;
  code?: string;
  criterion_text?: string;
  sort_order?: string;
};

function optionLabel(r: RequirementOption): string {
  const fw = [r.framework_code, r.framework_name].filter(Boolean).join(" / ");
  const version = [r.framework_version_number, r.framework_version_name]
    .filter(Boolean)
    .join(" / ");
  const level = [r.level_code, r.level_display_name].filter(Boolean).join(" / ");
  const principle = [r.principle_code, r.principle_display_name].filter(Boolean).join(" / ");
  const requirement = [r.code, r.title].filter(Boolean).join(" / ");
  const archived = r.framework_version_status === "archived" ? " (Archived)" : "";
  return `${fw || "—"} → ${version || "—"} → ${level || "—"} → ${principle || "—"} → ${requirement}${archived}`;
}

export function AssessmentCriterionFormDialog({ open, onOpenChange, criterion }: Props) {
  const isEdit = Boolean(criterion);

  const [requirementId, setRequirementId] = useState("");
  const [code, setCode] = useState("");
  const [criterionText, setCriterionText] = useState("");
  const [helpText, setHelpText] = useState("");
  const [sortOrder, setSortOrder] = useState<string>("1");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const requirements = useRequirementOptions(open);
  const createMut = useCreateAssessmentCriterion();
  const updateMut = useUpdateAssessmentCriterion();
  const submitting = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (open) {
      setRequirementId(criterion?.requirement_id ?? "");
      setCode(criterion?.code ?? "");
      setCriterionText(criterion?.criterion_text ?? "");
      setHelpText(criterion?.help_text ?? "");
      setSortOrder(criterion?.sort_order != null ? String(criterion.sort_order) : "1");
      setErrors({});
      setSubmitError(null);
    }
  }, [open, criterion]);

  // Keep the currently assigned Requirement visible when editing a Criterion whose
  // parent Framework Version is archived (archived versions are excluded from the list).
  const requirementOptions = useMemo<RequirementOption[]>(() => {
    const list = requirements.data ?? [];
    const current = criterion?.requirement;
    if (current && !list.some((r) => r.id === current.id)) {
      const p = current.principle;
      const lv = p?.level;
      const fv = lv?.framework_version;
      return [
        {
          id: current.id,
          code: current.code,
          title: current.title,
          sort_order: current.sort_order,
          principle_code: p?.code ?? "",
          principle_display_name: p?.display_name ?? "",
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
  }, [requirements.data, criterion]);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!requirementId) next.requirement_id = "Requirement is required.";
    if (!code.trim()) next.code = "Code is required.";
    else if (code.trim().length > 32) next.code = "Code must be 32 characters or fewer.";
    if (!criterionText.trim()) next.criterion_text = "Criterion Text is required.";
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
      requirement_id: requirementId,
      code: code.trim(),
      criterion_text: criterionText.trim(),
      help_text: helpText.trim() ? helpText.trim() : null,
      sort_order: Number(sortOrder),
    };
    try {
      if (isEdit && criterion) {
        await updateMut.mutateAsync({
          id: criterion.id,
          input: base as AssessmentCriterionUpdateInput,
        });
        toast.success("Assessment Criterion updated");
      } else {
        await createMut.mutateAsync(base as AssessmentCriterionCreateInput);
        toast.success("Assessment Criterion created");
      }
      onOpenChange(false);
    } catch (err) {
      // Dialog stays open so the user can correct the values.
      setSubmitError(friendlyAssessmentCriterionError(err));
    }
  }

  if (!open) return null;

  const heading = isEdit ? "Edit assessment criterion" : "New assessment criterion";
  const subtitle = isEdit
    ? "Update the assessment criterion details."
    : "Add a new assessment criterion under a Requirement.";

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
        aria-labelledby="ac-form-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-background shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="ac-form-title" className="text-base font-semibold text-foreground">
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
            <label htmlFor="ac-requirement" className="text-sm font-medium text-foreground">
              Requirement <span className="text-destructive">*</span>
            </label>
            <select
              id="ac-requirement"
              value={requirementId}
              onChange={(e) => setRequirementId(e.target.value)}
              disabled={submitting || requirements.isLoading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              aria-invalid={Boolean(errors.requirement_id)}
            >
              <option value="">
                {requirements.isLoading ? "Loading requirements…" : "Select a requirement"}
              </option>
              {requirementOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {optionLabel(r)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Framework / Version / Level / Principle / Requirement
            </p>
            {errors.requirement_id && (
              <p className="text-xs text-destructive">{errors.requirement_id}</p>
            )}
            {requirements.isError && (
              <p className="text-xs text-destructive">
                Couldn't load requirements. Try closing and reopening this dialog.
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:max-w-[12rem]">
            <label htmlFor="ac-code" className="text-sm font-medium text-foreground">
              Code <span className="text-destructive">*</span>
            </label>
            <input
              id="ac-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={submitting}
              autoComplete="off"
              maxLength={32}
              placeholder="e.g. AC1"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              aria-invalid={Boolean(errors.code)}
            />
            {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ac-text" className="text-sm font-medium text-foreground">
              Criterion Text <span className="text-destructive">*</span>
            </label>
            <textarea
              id="ac-text"
              value={criterionText}
              onChange={(e) => setCriterionText(e.target.value)}
              disabled={submitting}
              rows={3}
              placeholder="e.g. Evidence of an approved donor selection policy"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              aria-invalid={Boolean(errors.criterion_text)}
            />
            {errors.criterion_text && (
              <p className="text-xs text-destructive">{errors.criterion_text}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ac-help" className="text-sm font-medium text-foreground">
              Help Text
            </label>
            <textarea
              id="ac-help"
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              disabled={submitting}
              rows={3}
              placeholder="Optional help text for assessors"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
            />
          </div>

          <div className="space-y-1.5 sm:max-w-[12rem]">
            <label htmlFor="ac-order" className="text-sm font-medium text-foreground">
              Sort Order <span className="text-destructive">*</span>
            </label>
            <input
              id="ac-order"
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
              {isEdit ? "Save changes" : "Create criterion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}