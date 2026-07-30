import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  CircleDot,
  CircleCheck,
  LayoutList,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useResponseTypes, useSaveResponse, useWorkspace } from "./hooks";
import { AssessmentNotFoundError, friendlyWorkspaceError } from "./service";
import type { WorkspaceRequirement } from "./types";

type SaveState = "idle" | "saving" | "saved" | "error";

function requirementState(req: WorkspaceRequirement): "not_started" | "in_progress" | "completed" {
  const done = req.criteria.filter((c) => c.status === "completed").length;
  if (done === 0) return "not_started";
  if (done === req.criteria.length) return "completed";
  return "in_progress";
}

export function AssessmentWorkspaceView({ assessmentId }: { assessmentId: string }) {
  const query = useWorkspace(assessmentId);
  const typesQuery = useResponseTypes();
  const save = useSaveResponse(assessmentId);

  const [reqIndex, setReqIndex] = useState(0);
  const [critIndex, setCritIndex] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [pendingTypeId, setPendingTypeId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const data = query.data;
  const requirements = useMemo(() => data?.requirements ?? [], [data]);
  const requirement = requirements[reqIndex];
  const criterion = requirement?.criteria[critIndex];

  useEffect(() => {
    setSaveState("idle");
    setPendingTypeId(null);
  }, [criterion?.response_id]);

  if (query.isPending) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (query.isError) {
    const notFound = query.error instanceof AssessmentNotFoundError;
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center">
        <AlertCircle className="mx-auto h-6 w-6 text-destructive" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-foreground">
          {notFound
            ? "Assessment not found or you do not have access to it."
            : "Unable to load the Assessment."}
        </p>
        {!notFound && (
          <p className="mt-1 text-xs text-muted-foreground">
            {friendlyWorkspaceError(query.error)}
          </p>
        )}
        <div className="mt-4 flex justify-center gap-2">
          <Link
            to="/my-assessments"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to My Assessments
          </Link>
          {!notFound && (
            <button
              type="button"
              onClick={() => query.refetch()}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!data || !requirement || !criterion) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          This Assessment has no Criteria assigned to you.
        </p>
        <Link
          to="/my-assessments"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to My Assessments
        </Link>
      </div>
    );
  }

  const progress =
    data.total_count > 0 ? Math.round((data.completed_count / data.total_count) * 100) : 0;
  const selectedTypeId = pendingTypeId ?? criterion.response_type_id;
  const isFirst = reqIndex === 0 && critIndex === 0;
  const isLastCriterionInReq = critIndex === requirement.criteria.length - 1;
  const reqDone = requirementState(requirement) === "completed";

  function goTo(r: number, c: number) {
    setReqIndex(r);
    setCritIndex(c);
  }

  function goPrev() {
    if (critIndex > 0) return setCritIndex(critIndex - 1);
    if (reqIndex > 0) {
      const prev = requirements[reqIndex - 1];
      goTo(reqIndex - 1, Math.max(prev.criteria.length - 1, 0));
    }
  }

  function goNext() {
    if (!isLastCriterionInReq) return setCritIndex(critIndex + 1);
    if (reqIndex < requirements.length - 1) goTo(reqIndex + 1, 0);
  }

  function doSave(typeId: string) {
    setPendingTypeId(typeId);
    setSaveState("saving");
    save.mutate(
      {
        responseId: criterion!.response_id,
        responseTypeId: typeId,
        assessmentId: data!.assessment_id,
        assessmentStatus: data!.assessment_status,
      },
      {
        onSuccess: () => setSaveState("saved"),
        onError: () => setSaveState("error"),
      },
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/my-assessments"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> My Assessments
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            {data.framework_name}
          </h1>
          <p className="text-sm text-muted-foreground">{data.organization_name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data.framework_code} · Version {data.version_number}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium capitalize text-foreground">
            {data.assessment_status.replace(/_/g, " ")}
          </span>
          <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
              >
                <LayoutList className="h-3.5 w-3.5" /> Assessment Progress
              </button>
            </SheetTrigger>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Assessment Progress</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {requirements.map((r, i) => {
                  const state = requirementState(r);
                  const prevReq = requirements[i - 1];
                  const newGroup =
                    !prevReq ||
                    prevReq.level_name !== r.level_name ||
                    prevReq.principle_name !== r.principle_name;
                  return (
                    <div key={r.id}>
                      {newGroup && (
                        <p className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {r.level_name} · {r.principle_name}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          goTo(i, 0);
                          setPanelOpen(false);
                        }}
                        className={`flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                          i === reqIndex ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        {state === "completed" ? (
                          <CircleCheck className="mt-0.5 h-4 w-4 text-primary" />
                        ) : state === "in_progress" ? (
                          <CircleDot className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        ) : (
                          <CircleDashed className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="flex-1">
                          <span className="block font-medium text-foreground">
                            {r.code ? `${r.code} — ` : ""}
                            {r.title}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {state === "completed"
                              ? "Completed"
                              : state === "in_progress"
                                ? "In progress"
                                : "Not started"}
                          </span>
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <p className="text-foreground">
            {data.completed_count} of {data.total_count} Criteria completed
          </p>
          <p className="font-semibold text-foreground">{progress}%</p>
        </div>
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {requirement.level_name}
            {requirement.principle_name ? ` · ${requirement.principle_name}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Requirement {reqIndex + 1} of {requirements.length}
          </p>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            {requirement.code ? `${requirement.code} — ` : ""}
            {requirement.title}
          </h2>
          {requirement.description && (
            <p className="mt-1 text-sm text-muted-foreground">{requirement.description}</p>
          )}
        </div>

        <div className="px-4 py-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Criterion {critIndex + 1} of {requirement.criteria.length}
            </p>
            {criterion.status !== "completed" && !pendingTypeId && (
              <span className="text-xs text-muted-foreground">Not answered yet</span>
            )}
          </div>
          <h3 className="mt-2 text-base font-medium text-foreground">
            {criterion.code ? `${criterion.code} — ` : ""}
            {criterion.title}
          </h3>
          {criterion.description && (
            <p className="mt-1.5 text-sm text-muted-foreground">{criterion.description}</p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(typesQuery.data ?? []).map((t) => {
              const selected = selectedTypeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={selected}
                  disabled={saveState === "saving"}
                  onClick={() => doSave(t.id)}
                  className={`relative rounded-lg border p-4 text-left transition-colors disabled:opacity-70 ${
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <span className="flex items-start gap-2">
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-border"
                      style={t.color ? { backgroundColor: t.color } : undefined}
                      aria-hidden="true"
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {t.display_name}
                      </span>
                      {t.description && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {t.description}
                        </span>
                      )}
                    </span>
                    {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 min-h-5 text-xs">
            {saveState === "saving" && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
              </span>
            )}
            {saveState === "saved" && (
              <span className="inline-flex items-center gap-1.5 text-primary">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            {saveState === "error" && (
              <span className="inline-flex items-center gap-2 text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                Could not save. {friendlyWorkspaceError(save.error)}
                <button
                  type="button"
                  onClick={() => pendingTypeId && doSave(pendingTypeId)}
                  className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 font-medium text-foreground hover:bg-accent"
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </span>
            )}
          </div>

          {isLastCriterionInReq && reqDone && (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
              <Check className="h-3.5 w-3.5" /> Requirement completed
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={isFirst || saveState === "saving"}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={
                saveState === "saving" ||
                (isLastCriterionInReq && reqIndex === requirements.length - 1)
              }
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLastCriterionInReq ? "Continue to Next Requirement" : "Next"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goTo(reqIndex - 1, 0)}
              disabled={reqIndex === 0 || saveState === "saving"}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous Requirement
            </button>
            <button
              type="button"
              onClick={() => goTo(reqIndex + 1, 0)}
              disabled={reqIndex >= requirements.length - 1 || saveState === "saving"}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
            >
              Next Requirement <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}