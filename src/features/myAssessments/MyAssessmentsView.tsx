import { Link } from "@tanstack/react-router";
import { AlertCircle, ClipboardList, RefreshCw } from "lucide-react";
import { useMyAssessments } from "./hooks";
import { friendlyMyAssessmentError } from "./service";

export function MyAssessmentsView() {
  const query = useMyAssessments();
  const rows = query.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">My Assessments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Assessments assigned to you and your progress.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {query.isError && (
          <div className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Couldn't load your assessments</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {friendlyMyAssessmentError(query.error)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}

        {!query.isError && query.isPending && (
          <p className="p-6 text-sm text-muted-foreground">Loading assessments…</p>
        )}

        {!query.isError && !query.isPending && rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <ClipboardList className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              No Assessments are currently assigned to you.
            </p>
          </div>
        )}

        {!query.isError && !query.isPending && rows.length > 0 && (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li
                key={r.assessment_id}
                className="flex flex-col gap-4 p-5 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-foreground">
                      {r.organization_name}
                    </h2>
                    <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {r.framework_code} · Version {r.version_number}
                  </p>
                  <div className="mt-3 max-w-md">
                    <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                      <span>
                        {r.completed_count} of {r.total_count} answered
                      </span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {r.progress}%
                      </span>
                    </div>
                    <div
                      className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuenow={r.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${r.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
                <Link
                  to="/my-assessments/$assessmentId"
                  params={{ assessmentId: r.assessment_id }}
                  className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {r.completed_count > 0 ? "Continue" : "Start"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}