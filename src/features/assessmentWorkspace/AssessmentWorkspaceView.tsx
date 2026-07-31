import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Check, Loader2, RefreshCw } from "lucide-react";
import { useResponseTypes, useSaveResponse, useWorkspace } from "./hooks";
import { AssessmentNotFoundError, friendlyWorkspaceError } from "./service";
import {
  buildResults,
  buildScale,
  buildOutline,
  requirementGradedCount,
  requirementScore,
} from "./results";
import { ProgressSidebar } from "./ProgressSidebar";
import type { WorkspaceRequirement } from "./types";

type SaveState = { state: "saving" | "saved" | "error"; typeId: string };

export function AssessmentWorkspaceView({ assessmentId }: { assessmentId: string }) {
  const query = useWorkspace(assessmentId);
  const typesQuery = useResponseTypes();
  const save = useSaveResponse(assessmentId);

  const [saveByResponse, setSaveByResponse] = useState<Record<string, SaveState>>({});
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const data = query.data;
  const requirements = useMemo(() => data?.requirements ?? [], [data]);
  const scale = useMemo(() => buildScale(typesQuery.data ?? []), [typesQuery.data]);
  const results = useMemo(() => buildResults(requirements, scale), [requirements, scale]);
  const outline = useMemo(() => buildOutline(requirements, scale), [requirements, scale]);

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

  if (!data || requirements.length === 0) {
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

  function scrollTo(id: string) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <Link
            to="/my-assessments"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> My Assessments
          </Link>
          <h1 className="mt-2 truncate text-xl font-semibold tracking-tight text-foreground">
            {data.framework_name}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {data.organization_name} · {data.framework_code} · v{data.version_number}
          </p>
        </div>
        <span className="shrink-0 self-start rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium capitalize text-foreground">
          {data.assessment_status.replace(/_/g, " ")}
        </span>
      </header>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <div className="sticky top-6 max-h-[calc(100vh-3rem)] space-y-4 overflow-y-auto pr-1">
            <ProgressSidebar
              overall={results.overall}
              band={results.band}
              graded={results.graded}
              total={results.total}
              levels={outline}
              principles={results.principles}
              clauses={results.clauses}
              onJump={scrollTo}
            />
          </div>
        </aside>

        <main className="min-w-0 space-y-10">
          <p className="rounded-xl border-l-4 border-primary bg-card p-4 text-sm leading-relaxed text-foreground">
            <strong className="font-semibold">Unified grading.</strong> Grade each criterion once on
            a single scale. Requirements are organised by level, then by principle; every grade
            feeds the progress bars on the left.
          </p>

          {outline.map((level) => (
            <section
              key={level.key}
              ref={(el) => {
                sectionRefs.current[level.key] = el;
              }}
              className="scroll-mt-6 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3">
                <h2 className="flex items-baseline gap-2 text-base font-semibold text-primary-foreground">
                  {level.code ? (
                    <span className="font-mono text-xs opacity-80">{level.code}</span>
                  ) : null}
                  {level.name}
                </h2>
                <span className="text-xs font-medium tabular-nums text-primary-foreground/85">
                  {level.percent === null ? "–" : `${level.percent}%`} · {level.graded}/{level.total} graded
                </span>
              </div>

              {level.principles.map((principle) => (
                <div
                  key={principle.key}
                  ref={(el) => {
                    sectionRefs.current[principle.key] = el;
                  }}
                  className="scroll-mt-6 space-y-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
                    <h3 className="flex items-baseline gap-2 text-sm font-semibold text-foreground">
                      {principle.code ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {principle.code}
                        </span>
                      ) : null}
                      {principle.name}
                    </h3>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {principle.graded}/{principle.total} graded
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${principle.percent ?? 0}%` }}
                    />
                  </div>

                  {principle.items.map((req) => (
                    <RequirementCard
                      key={req.id}
                      req={req}
                      scale={scale}
                      saveByResponse={saveByResponse}
                      onSelect={doSave}
                      saveError={save.error}
                    />
                  ))}
                </div>
              ))}
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}

function RequirementCard({
  req,
  scale,
  saveByResponse,
  onSelect,
  saveError,
}: {
  req: WorkspaceRequirement;
  scale: ReturnType<typeof buildScale>;
  saveByResponse: Record<string, SaveState>;
  onSelect: (responseId: string, typeId: string) => void;
  saveError: unknown;
}) {
  const score = requirementScore(req, scale);
  const graded = requirementGradedCount(req);
  const done = graded === req.criteria.length && req.criteria.length > 0;

  return (
    <article className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 px-4 pt-4">
        {req.code && (
          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground">
            {req.code}
          </span>
        )}
        {req.principle_name && (
          <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {req.principle_name}
          </span>
        )}
        {req.level_name && (
          <span className="text-xs text-muted-foreground">{req.level_name}</span>
        )}
        <span
          className={`ml-auto rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            done
              ? "bg-primary/10 text-primary"
              : graded > 0
                ? "bg-muted text-foreground"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {done ? `Graded · ${Math.round((score ?? 0) * 100)}%` : graded > 0 ? "In progress" : "Pending"}
        </span>
      </div>

      <div className="px-4 pb-2 pt-3">
        <p className="text-[15px] leading-relaxed text-foreground">{req.title}</p>
        {req.description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{req.description}</p>
        )}
      </div>

      <div className="divide-y divide-border">
        {req.criteria.map((criterion) => {
          const saveState = saveByResponse[criterion.response_id];
          const selectedTypeId =
            saveState && saveState.state !== "error"
              ? saveState.typeId
              : (criterion.response_type_id ?? saveState?.typeId ?? null);
          return (
            <div key={criterion.response_id} className="px-4 py-4">
              {req.criteria.length > 1 && (
                <p className="mb-2 text-sm text-foreground">{criterion.title}</p>
              )}
              {criterion.description && (
                <p className="mb-2 text-xs text-muted-foreground">{criterion.description}</p>
              )}
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Grade
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {scale.ordered.map((t, i) => {
                  const selected = selectedTypeId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={selected}
                      disabled={saveState?.state === "saving"}
                      onClick={() => onSelect(criterion.response_id, t.id)}
                      className={`rounded-lg border px-2 py-2.5 text-center transition-colors disabled:opacity-70 ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-accent"
                      }`}
                    >
                      <span className="block text-base font-semibold tabular-nums">{i}</span>
                      <span className="block text-[11px] opacity-80">{t.display_name}</span>
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
                    Could not save. {friendlyWorkspaceError(saveError)}
                    <button
                      type="button"
                      onClick={() => onSelect(criterion.response_id, saveState.typeId)}
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
    </article>
  );
}
