import { useMemo, useState } from "react";
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
import {
  buildProgressBreakdown,
  requirementPercent,
  requirementState,
} from "./progress";
import { ProgressBreakdown } from "./ProgressBreakdown";

type SaveState = { state: "saving" | "saved" | "error"; typeId: string };

export function AssessmentWorkspaceView({ assessmentId }: { assessmentId: string }) {
  const query = useWorkspace(assessmentId);
  const typesQuery = useResponseTypes();
  const save = useSaveResponse(assessmentId);

  const [reqIndex, setReqIndex] = useState(0);
  const [saveByResponse, setSaveByResponse] = useState<Record<string, SaveState>>({});
  const [panelOpen, setPanelOpen] = useState(false);

  const data = query.data;
  const requirements = useMemo(() => data?.requirements ?? [], [data]);
  const requirement = requirements[reqIndex];
  const breakdown = useMemo(() => buildProgressBreakdown(requirements), [requirements]);

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

  if (!data || !requirement) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          This Assessment has nothing assigned to you.
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
  const reqPercent = requirementPercent(requirement);

  function doSave(responseId: string, typeId: string) {
    setSaveByResponse((prev) => ({ ...prev, [responseId]: { state: "saving", typeId } }));
    save.mutate(
      {
        responseId,
        responseTypeId: typeId,
        assessmentId: data!.assessment_id,
        assessmentStatus: data!.assessment_status,
      },
      {
        onSuccess: () =>
          setSaveByResponse((prev) => ({ ...prev, [responseId]: { state: "saved", typeId } })),
        onError: () =>
          setSaveByResponse((prev) => ({ ...prev, [responseId]: { state: "error", typeId } })),
      },
    );
  }

  return (
    <div className="space-y-6">
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
                <LayoutList className="h-3.5 w-3.5" /> Requirements
              </button>
            </SheetTrigger>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Requirements</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-2">
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
                        <p className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {r.level_name} · {r.principle_name}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setReqIndex(i);
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
                            {requirementPercent(r)}% complete
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
          <p className="text-foreground">Overall progress</p>
          <p className="font-semibold tabular-nums text-foreground">{progress}%</p>
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

      <ProgressBreakdown
        levels={breakdown.levels}
        principles={breakdown.principles}
        processClauses={breakdown.processClauses}
      />

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-4">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
              {requirement.level_name || "—"}
            </span>
            <ChevronRight className="h-3 w-3" />
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
              {requirement.principle_name || "—"}
            </span>
            {requirement.process_clauses.map((pc) => (
              <span
                key={pc.id}
                className="rounded-full border border-border px-2 py-0.5 font-medium"
              >
                {pc.code ? `${pc.code} · ` : ""}
                {pc.display_name}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Requirement {reqIndex + 1} of {requirements.length} · {reqPercent}% complete
          </p>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            {requirement.code ? `${requirement.code} — ` : ""}
            {requirement.title}
          </h2>
          {requirement.description && (
            <p className="mt-1.5 text-sm text-muted-foreground">{requirement.description}</p>
          )}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${reqPercent}%` }}
            />
          </div>
        </div>

        <div className="divide-y divide-border">
          {requirement.criteria.map((criterion) => {
            const saveState = saveByResponse[criterion.response_id];
            const selectedTypeId =
              saveState && saveState.state !== "error"
                ? saveState.typeId
                : (saveState?.typeId ?? criterion.response_type_id);
            return (
              <div key={criterion.response_id} className="px-4 py-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">{criterion.title}</p>
                  {criterion.status === "completed" || saveState?.state === "saved" ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <Check className="h-3 w-3" /> Answered
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs text-muted-foreground">Not answered</span>
                  )}
                </div>
                {criterion.description && (
                  <p className="mt-1.5 text-sm text-muted-foreground">{criterion.description}</p>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(typesQuery.data ?? []).map((t) => {
                    const selected = selectedTypeId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={selected}
                        disabled={saveState?.state === "saving"}
                        onClick={() => doSave(criterion.response_id, t.id)}
                        className={`relative rounded-lg border p-3 text-left transition-colors disabled:opacity-70 ${
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

                <div className="mt-2 min-h-5 text-xs">
                  {saveState?.state === "saving" && (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                    </span>
                  )}
                  {saveState?.state === "saved" && (
                    <span className="inline-flex items-center gap-1.5 text-primary">
                      <Check className="h-3.5 w-3.5" /> Saved
                    </span>
                  )}
                  {saveState?.state === "error" && (
                    <span className="inline-flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Could not save. {friendlyWorkspaceError(save.error)}
                      <button
                        type="button"
                        onClick={() => doSave(criterion.response_id, saveState.typeId)}
                        className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 font-medium text-foreground hover:bg-accent"
                      >
                        <RefreshCw className="h-3 w-3" /> Retry
                      </button>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={() => setReqIndex((i) => Math.max(i - 1, 0))}
            disabled={reqIndex === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" /> Previous Requirement
          </button>
          <button
            type="button"
            onClick={() => setReqIndex((i) => Math.min(i + 1, requirements.length - 1))}
            disabled={reqIndex >= requirements.length - 1}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Next Requirement <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
