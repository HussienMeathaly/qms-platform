import { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { Principle } from "./types";
import { useDeletePrinciple } from "./hooks";
import { friendlyPrincipleError } from "./service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  principle: Principle | null;
};

export function DeletePrincipleDialog({ open, onOpenChange, principle }: Props) {
  const del = useDeletePrinciple();
  const [error, setError] = useState<string | null>(null);

  if (!open || !principle) return null;

  const busy = del.isPending;

  async function handleDelete() {
    if (!principle) return;
    setError(null);
    try {
      await del.mutateAsync(principle.id);
      toast.success("Principle deleted");
      onOpenChange(false);
    } catch (err) {
      setError(friendlyPrincipleError(err));
    }
  }

  const lv = principle.level;
  const fv = lv?.framework_version;
  const label = `${fv?.framework?.code ?? "—"} — Version ${fv?.version_number ?? ""} — ${lv?.code ?? ""} · ${principle.code} ${principle.display_name}`;

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
        aria-labelledby="del-pr-title"
        className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background shadow-lg"
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="del-pr-title" className="text-base font-semibold text-foreground">
                Delete principle
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This will permanently remove{" "}
                <span className="font-medium text-foreground">{label}</span>. Any dependent
                Requirements will be removed by the database (cascade). This action cannot be undone.
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
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Delete principle
          </button>
        </div>
      </div>
    </div>
  );
}