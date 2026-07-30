import { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { ProcessClause } from "./types";
import { useDeleteProcessClause, useProcessClauseDependencies } from "./hooks";
import { friendlyProcessClauseError } from "./service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clause: ProcessClause | null;
};

export function DeleteProcessClauseDialog({ open, onOpenChange, clause }: Props) {
  const del = useDeleteProcessClause();
  const deps = useProcessClauseDependencies(clause?.id, open);
  const [error, setError] = useState<string | null>(null);

  if (!open || !clause) return null;

  const busy = del.isPending;
  const loadingDeps = deps.isLoading || deps.isFetching;
  const depError = deps.isError;
  const counts = deps.data;
  const mappingCount = counts?.requirement_process_clauses ?? 0;
  const hasDeps = Boolean(counts) && mappingCount > 0;
  const checksPassed = Boolean(counts) && !depError && !loadingDeps;
  const canDelete = checksPassed && !hasDeps;

  async function handleDelete() {
    if (!clause) return;
    setError(null);
    // Defensive guard: never dispatch DELETE while checks are loading, failed,
    // unavailable, or when any Requirement mapping exists.
    if (loadingDeps || depError || !counts) return;
    if (counts.requirement_process_clauses > 0) return;
    try {
      await del.mutateAsync(clause.id);
      toast.success("Process Clause deleted");
      onOpenChange(false);
    } catch (err) {
      setError(friendlyProcessClauseError(err));
    }
  }

  const fv = clause.framework_version;
  const label = `${fv?.framework?.code ?? "—"} — Version ${fv?.version_number ?? ""} · ${clause.code} ${clause.display_name}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-foreground/40"
        onClick={() => !busy && onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="del-pc-title"
        className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background shadow-lg"
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="del-pc-title" className="text-base font-semibold text-foreground">
                {hasDeps ? "Cannot delete Process Clause" : "Delete process clause"}
              </h2>
              <div className="mt-1 text-sm text-muted-foreground">
                {loadingDeps ? (
                  <p>
                    Checking dependencies for{" "}
                    <span className="font-medium text-foreground">{label}</span>…
                  </p>
                ) : depError ? (
                  <p>
                    Couldn't verify linked Requirements (
                    {friendlyProcessClauseError(deps.error)}). Retry the check before deleting.
                  </p>
                ) : hasDeps ? (
                  <>
                    <p>
                      <span className="font-medium text-foreground">{label}</span> cannot be deleted
                      because it has:
                    </p>
                    <ul className="mt-2 list-disc space-y-0.5 pl-5">
                      <li>
                        {mappingCount} linked{" "}
                        {mappingCount === 1 ? "Requirement" : "Requirements"}
                      </li>
                    </ul>
                    <p className="mt-2">
                      A Process Clause cannot be deleted while Requirement mappings exist. Remove
                      those mappings first.
                    </p>
                  </>
                ) : (
                  <p>
                    This will permanently remove{" "}
                    <span className="font-medium text-foreground">{label}</span>. This action cannot
                    be undone.
                  </p>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => !busy && onOpenChange(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
          >
            {hasDeps ? "Close" : "Cancel"}
          </button>
          {depError && (
            <button
              type="button"
              onClick={() => deps.refetch()}
              disabled={busy || deps.isFetching}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
            >
              {deps.isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Retry check
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete clause
            </button>
          )}
        </div>
      </div>
    </div>
  );
}