import { useState } from "react";
import { Archive, Loader2, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { FrameworkVersion } from "./types";
import { useArchiveFrameworkVersion } from "./hooks";
import { friendlyFrameworkVersionError } from "./service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: FrameworkVersion | null;
};

export function ArchiveFrameworkVersionDialog({ open, onOpenChange, version }: Props) {
  const arch = useArchiveFrameworkVersion();
  const [error, setError] = useState<string | null>(null);

  if (!open || !version) return null;

  const busy = arch.isPending;
  const blockedCurrent = version.is_current;

  async function handleArchive() {
    if (!version || blockedCurrent) return;
    setError(null);
    try {
      await arch.mutateAsync(version.id);
      toast.success("Version archived");
      onOpenChange(false);
    } catch (err) {
      setError(friendlyFrameworkVersionError(err));
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
        aria-labelledby="arch-fv-title"
        className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background shadow-lg"
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
              {blockedCurrent ? (
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Archive className="h-4 w-4" aria-hidden="true" />
              )}
            </div>
            <div>
              <h2 id="arch-fv-title" className="text-base font-semibold text-foreground">
                Archive version
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {blockedCurrent ? (
                  <>
                    <span className="font-medium text-foreground">
                      {version.framework?.code} {version.version_number}
                    </span>{" "}
                    is marked as the current version and cannot be archived. Set another version as
                    current first.
                  </>
                ) : (
                  <>
                    <span className="font-medium text-foreground">
                      {version.framework?.code} {version.version_number} — {version.version_name}
                    </span>{" "}
                    will remain stored for historical reference but will no longer be active for
                    normal use.
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
          {!blockedCurrent && (
            <button
              type="button"
              onClick={handleArchive}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600/90 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
              Archive version
            </button>
          )}
        </div>
      </div>
    </div>
  );
}