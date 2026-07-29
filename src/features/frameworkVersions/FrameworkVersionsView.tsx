import { useEffect, useState } from "react";
import {
  AlertCircle,
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  GitBranch,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useFrameworkVersions } from "./hooks";
import type {
  FrameworkVersion,
  FrameworkVersionSortField,
  FrameworkVersionStatus,
  SortDirection,
} from "./types";
import { FrameworkVersionFormDialog } from "./FrameworkVersionFormDialog";
import { ArchiveFrameworkVersionDialog } from "./ArchiveFrameworkVersionDialog";
import { friendlyFrameworkVersionError } from "./service";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

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

function StatusBadge({ status }: { status: FrameworkVersionStatus }) {
  const styles: Record<FrameworkVersionStatus, string> = {
    draft: "bg-muted text-muted-foreground",
    published: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    archived: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  };
  const dot: Record<FrameworkVersionStatus, string> = {
    draft: "bg-muted-foreground/60",
    published: "bg-emerald-500",
    archived: "bg-amber-500",
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", styles[status])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[status])} />
      {label}
    </span>
  );
}

function CurrentBadge({ current }: { current: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        current ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", current ? "bg-primary" : "bg-muted-foreground/60")} />
      {current ? "Current" : "Not Current"}
    </span>
  );
}

function SortHeader({
  label,
  field,
  activeField,
  direction,
  onSort,
}: {
  label: string;
  field: FrameworkVersionSortField;
  activeField: FrameworkVersionSortField;
  direction: SortDirection;
  onSort: (f: FrameworkVersionSortField) => void;
}) {
  const isActive = activeField === field;
  const Icon = !isActive ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
    >
      {label}
      <Icon className={cn("h-3 w-3", isActive ? "text-foreground" : "text-muted-foreground/60")} />
    </button>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 items-center gap-3 px-4 py-3">
          <div className="col-span-2 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-1 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-2 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-1 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-1 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-1 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-1 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-1 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-1 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-1 h-4 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function FrameworkVersionsView() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput, 300);
  const [sortField, setSortField] = useState<FrameworkVersionSortField>("updated_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FrameworkVersion | null>(null);
  const [archiving, setArchiving] = useState<FrameworkVersion | null>(null);

  const query = useFrameworkVersions({
    search,
    sortField,
    sortDirection,
    page,
    pageSize: PAGE_SIZE,
  });

  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isEmpty = !query.isLoading && !query.isError && rows.length === 0 && !search;
  const isNoResults = !query.isLoading && !query.isError && rows.length === 0 && Boolean(search);

  function handleSort(field: FrameworkVersionSortField) {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openView(v: FrameworkVersion) {
    setEditing(v);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Framework Versions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage versions of assessment frameworks.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Version
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search by framework, version, or name"
              aria-label="Search framework versions"
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {query.isFetching && !query.isLoading && (
              <span className="inline-flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" /> Refreshing
              </span>
            )}
            <span>
              {total} version{total === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {query.isError && (
          <div className="border-b border-border bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Couldn't load versions</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {friendlyFrameworkVersionError(query.error)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => query.refetch()}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
            </div>
          </div>
        )}

        <div className="hidden grid-cols-12 gap-3 border-b border-border bg-muted/40 px-4 py-2.5 md:grid">
          <div className="col-span-2">
            <SortHeader label="Framework" field="framework" activeField={sortField} direction={sortDirection} onSort={handleSort} />
          </div>
          <div className="col-span-1">
            <SortHeader label="Version" field="version_number" activeField={sortField} direction={sortDirection} onSort={handleSort} />
          </div>
          <div className="col-span-2">
            <SortHeader label="Version Name" field="version_name" activeField={sortField} direction={sortDirection} onSort={handleSort} />
          </div>
          <div className="col-span-1">
            <SortHeader label="Status" field="status" activeField={sortField} direction={sortDirection} onSort={handleSort} />
          </div>
          <div className="col-span-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current</div>
          <div className="col-span-1">
            <SortHeader label="From" field="effective_from" activeField={sortField} direction={sortDirection} onSort={handleSort} />
          </div>
          <div className="col-span-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">To</div>
          <div className="col-span-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Published</div>
          <div className="col-span-1">
            <SortHeader label="Updated" field="updated_at" activeField={sortField} direction={sortDirection} onSort={handleSort} />
          </div>
          <div className="col-span-1 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</div>
        </div>

        {query.isLoading ? (
          <TableSkeleton />
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <GitBranch className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No versions yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create your first version to start building a framework's structure.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create your first version
            </button>
          </div>
        ) : isNoResults ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No results</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No versions match "{search}".
            </p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border">
            {rows.map((v) => {
              const isDraft = v.status === "draft";
              const isArchived = v.status === "archived";
              return (
                <li key={v.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-sm">
                  {/* Mobile */}
                  <div className="col-span-12 flex items-start justify-between gap-3 md:hidden">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-mono text-muted-foreground">
                        {v.framework?.code ?? "—"}
                      </p>
                      <p className="truncate font-medium text-foreground">
                        {v.version_number} — {v.version_name}
                      </p>
                      {v.framework?.name && (
                        <p className="truncate text-xs text-muted-foreground">{v.framework.name}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={v.status} />
                      <CurrentBadge current={v.is_current} />
                    </div>
                  </div>
                  <div className="col-span-12 flex items-center justify-between gap-2 md:hidden">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(v.effective_from)} → {formatDate(v.effective_to)} · Upd {formatDate(v.updated_at)}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openView(v)}
                        aria-label={isDraft ? `Edit ${v.version_number}` : `View ${v.version_number}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 hover:bg-accent hover:text-foreground"
                      >
                        {isDraft ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      {!isArchived && (
                        <button
                          type="button"
                          onClick={() => setArchiving(v)}
                          aria-label={`Archive ${v.version_number}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-amber-600 hover:bg-amber-500/10"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="col-span-2 hidden min-w-0 md:block">
                    <p className="truncate font-mono text-xs text-foreground">{v.framework?.code ?? "—"}</p>
                    <p className="truncate text-xs text-muted-foreground">{v.framework?.name ?? ""}</p>
                  </div>
                  <div className="col-span-1 hidden truncate font-medium text-foreground md:block">
                    {v.version_number}
                  </div>
                  <div className="col-span-2 hidden min-w-0 md:block">
                    <p className="truncate font-medium text-foreground">{v.version_name}</p>
                    {v.description && (
                      <p className="truncate text-xs text-muted-foreground">{v.description}</p>
                    )}
                  </div>
                  <div className="col-span-1 hidden md:block">
                    <StatusBadge status={v.status} />
                  </div>
                  <div className="col-span-1 hidden md:block">
                    <CurrentBadge current={v.is_current} />
                  </div>
                  <div className="col-span-1 hidden text-xs text-muted-foreground md:block">
                    {formatDate(v.effective_from)}
                  </div>
                  <div className="col-span-1 hidden text-xs text-muted-foreground md:block">
                    {formatDate(v.effective_to)}
                  </div>
                  <div className="col-span-1 hidden text-xs text-muted-foreground md:block">
                    {formatDate(v.published_at)}
                  </div>
                  <div className="col-span-1 hidden text-xs text-muted-foreground md:block">
                    {formatDate(v.updated_at)}
                  </div>
                  <div className="col-span-1 hidden items-center justify-end gap-1 md:flex">
                    <button
                      type="button"
                      onClick={() => openView(v)}
                      aria-label={isDraft ? `Edit ${v.version_number}` : `View ${v.version_number}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 hover:bg-accent hover:text-foreground"
                    >
                      {isDraft ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    {!isArchived && (
                      <button
                        type="button"
                        onClick={() => setArchiving(v)}
                        aria-label={`Archive ${v.version_number}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-amber-600 hover:bg-amber-500/10"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!query.isLoading && !query.isError && rows.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages} · {total} total
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || query.isFetching}
                className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || query.isFetching}
                className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <FrameworkVersionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        version={editing}
      />
      <ArchiveFrameworkVersionDialog
        open={Boolean(archiving)}
        onOpenChange={(open) => !open && setArchiving(null)}
        version={archiving}
      />
    </div>
  );
}