import { useState } from "react";
import { AlertCircle, ClipboardList, Plus, RefreshCw } from "lucide-react";
import { useAssessments } from "./hooks";
import { friendlyAssessmentError } from "./service";
import { NewAssessmentDialog } from "./NewAssessmentDialog";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function AssessmentsView() {
  const query = useAssessments();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const rows = query.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Assessments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create assessments and view existing ones.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Assessment
        </button>
      </div>

      {notice && (
        <p className="rounded-md border border-border bg-primary/5 px-3 py-2 text-sm text-foreground">
          {notice}
        </p>
      )}

      <div className="rounded-lg border border-border bg-card">
        {query.isError && (
          <div className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Couldn't load assessments</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {friendlyAssessmentError(query.error)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        )}

        {query.isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-4">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : !query.isError && rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ClipboardList className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No assessments yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create an assessment to generate its responses automatically.
            </p>
          </div>
        ) : !query.isError ? (
          <>
            <div className="hidden grid-cols-12 gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
              <div className="col-span-3">Organization</div>
              <div className="col-span-3">Framework Version</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Assigned User</div>
              <div className="col-span-1">Responses</div>
              <div className="col-span-1">Created</div>
            </div>
            <ul role="list" className="divide-y divide-border">
              {rows.map((a) => (
                <li key={a.id} className="grid grid-cols-12 gap-3 px-4 py-3 text-sm">
                  <div className="col-span-12 md:hidden">
                    <p className="font-medium text-foreground">
                      {a.organization_code} — {a.organization_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.framework_code} — {a.version_number} — {a.version_name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.status} · {a.assigned_user} · {a.responses_count} responses ·{" "}
                      {formatDate(a.created_at)}
                    </p>
                  </div>

                  <div className="col-span-3 hidden min-w-0 md:block">
                    <p className="truncate font-medium text-foreground">{a.organization_code}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.organization_name}</p>
                  </div>
                  <div className="col-span-3 hidden min-w-0 md:block">
                    <p className="truncate text-xs text-foreground">
                      {a.framework_code} — {a.version_number}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{a.version_name}</p>
                  </div>
                  <div className="col-span-2 hidden truncate text-xs text-foreground md:block">
                    {a.status}
                  </div>
                  <div className="col-span-2 hidden truncate text-xs text-foreground md:block">
                    {a.assigned_user}
                  </div>
                  <div className="col-span-1 hidden text-xs text-foreground md:block">
                    {a.responses_count}
                  </div>
                  <div className="col-span-1 hidden truncate text-xs text-muted-foreground md:block">
                    {formatDate(a.created_at)}
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      <NewAssessmentDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={(count) =>
          setNotice(`Assessment created successfully. ${count} responses were generated.`)
        }
      />
    </div>
  );
}