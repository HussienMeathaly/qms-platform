import { useState } from "react";
import { AlertTriangle, Archive, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { Framework } from "./types";
import {
  useArchiveFramework,
  useDeleteFramework,
  useFrameworkDependencyCount,
} from "./hooks";
import { friendlyFrameworkError } from "./service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  framework: Framework | null;
};

export function DeleteFrameworkDialog({ open, onOpenChange, framework }: Props) {
  const del = useDeleteFramework();
  const arch = useArchiveFramework();
  const deps = useFrameworkDependencyCount(framework?.id, open);
  const [error, setError] = useState<string | null>(null);

  if (!open || !framework) return null;

  const busy = del.isPending || arch.isPending;
  const hasDeps = (deps.data ?? 0) > 0;
  const loadingDeps = deps.isLoading;

  async function handleDelete() {
    if (!framework) return;
    setError(null);
    try {
      await del.mutateAsync(framework.id);
      toast.success("Framework deleted");
      onOpenChange(false);
    } catch (err) {
      setError(friendlyFrameworkError(err));
    }
  }

  async function handleArchive() {
    if (!framework) return;
    setError(null);
    try {
      await arch.mutateAsync(framework.id);
      toast.success("Framework archived");
      onOpenChange(false);
    } catch (err) {
      setError(friendlyFrameworkError(err));
    }
  }

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
        aria-labelledby="del-fw-title"
        className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background shadow-lg"
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="del-fw-title" className="text-base font-semibold text-foreground">
                {hasDeps ? "Archive framework" : "Delete framework"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {loadingDeps ? (
                  <>Checking dependencies for <span className="font-medium text-foreground">{framework.name}</span>…</>
                ) : hasDeps ? (
                  <>
                    <span className="font-medium text-foreground">{framework.name}</span> is referenced by {deps.data} related record{deps.data === 1 ? "" : "s"} and cannot be deleted. You can archive it instead — status becomes Archived and it is set inactive.
                  </>
                ) : (
                  <>
                    This will permanently remove <span className="font-medium text-foreground">{framework.name}</span> ({framework.code}). This action cannot be undone.
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
            Cancel
          </button>
          {loadingDeps ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-muted px-3 py-2 text-sm font-medium text-muted-foreground"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Checking…
            </button>
          ) : hasDeps ? (
            <button
              type="button"
              onClick={handleArchive}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600/90 disabled:opacity-60"
            >
              {arch.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
              Archive framework
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-60"
            >
              {del.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete framework
            </button>
          )}
        </div>
      </div>
    </div>
  );
}