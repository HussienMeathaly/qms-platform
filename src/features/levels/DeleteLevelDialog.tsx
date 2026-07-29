import { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { Level } from "./types";
import { useDeleteLevel, useLevelPrincipleCount } from "./hooks";
import { friendlyLevelError } from "./service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: Level | null;
};

export function DeleteLevelDialog({ open, onOpenChange, level }: Props) {
  const del = useDeleteLevel();
  const deps = useLevelPrincipleCount(level?.id, open);
  const [error, setError] = useState<string | null>(null);

  if (!open || !level) return null;

  const busy = del.isPending;
  const loadingDeps = deps.isLoading;
  const depError = deps.isError;
  const depCount = deps.data ?? 0;
  const hasDeps = depCount > 0;

  async function handleDelete() {
    if (!level) return;
    setError(null);
    // Safety guard: block deletion when dependents exist, independent of ON DELETE CASCADE.
    if (hasDeps || loadingDeps || depError) return;
    try {
      await del.mutateAsync(level.id);
      toast.success("Level deleted");
      onOpenChange(false);
    } catch (err) {
      setError(friendlyLevelError(err));
    }
  }

  const fv = level.framework_version;
  const label = `${fv?.framework?.code ?? "—"} — Version ${fv?.version_number ?? ""} — ${level.code} ${level.display_name}`;

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
        aria-labelledby="del-lv-title"
        className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background shadow-lg"
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="del-lv-title" className="text-base font-semibold text-foreground">
                {hasDeps ? "Cannot delete level" : "Delete level"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {loadingDeps ? (
                  <>Checking dependencies for <span className="font-medium text-foreground">{label}</span>…</>
                ) : depError ? (
                  <>Couldn't verify dependencies. Please close this dialog and try again.</>
                ) : hasDeps ? (
                  <>
                    <span className="font-medium text-foreground">{label}</span> is referenced by{" "}
                    {depCount} Principle{depCount === 1 ? "" : "s"} and cannot be deleted. Remove
                    or reassign the dependent Principles first.
                  </>
                ) : (
                  <>
                    This will permanently remove <span className="font-medium text-foreground">{label}</span>.
                    This action cannot be undone.
                  </>
                )}
              </p>
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
          {!hasDeps && !depError && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy || loadingDeps}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-60"
            >
              {(busy || loadingDeps) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete level
            </button>
          )}
        </div>
      </div>
    </div>
  );
}