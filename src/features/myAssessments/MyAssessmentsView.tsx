import { AlertCircle, ClipboardList, RefreshCw } from "lucide-react";
import { useMyAssessments } from "./hooks";
import { friendlyMyAssessmentError } from "./service";

const WORKSPACE_NOTICE = "Assessment workspace will be available in the next task.";

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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Framework</th>
                  <th className="px-4 py-3 font-medium">Version</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.assessment_id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground">{r.organization_name}</td>
                    <td className="px-4 py-3 text-foreground">{r.framework_code}</td>
                    <td className="px-4 py-3 text-foreground">{r.version_number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.status}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.completed_count} / {r.total_count} ({r.progress}%)
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled
                        title={WORKSPACE_NOTICE}
                        className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {r.completed_count > 0 ? "Continue Assessment" : "Start Assessment"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              {WORKSPACE_NOTICE}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}