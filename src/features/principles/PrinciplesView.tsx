import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ListTree,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { usePrinciples } from "./hooks";
import type { Principle, PrincipleSortField, SortDirection } from "./types";
import { PrincipleFormDialog } from "./PrincipleFormDialog";
import { DeletePrincipleDialog } from "./DeletePrincipleDialog";
import { friendlyPrincipleError } from "./service";
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

function SortHeader({
  label,
  field,
  activeField,
  direction,
  onSort,
  align = "left",
}: {
  label: string;
  field: PrincipleSortField;
  activeField: PrincipleSortField;
  direction: SortDirection;
  onSort: (f: PrincipleSortField) => void;
  align?: "left" | "right";
}) {
  const isActive = activeField === field;
  const Icon = !isActive ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground",
        align === "right" && "justify-end",
      )}
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
          <div className="col-span-1 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-1 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-2 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-2 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-1 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-1 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-1 h-4 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function PrinciplesView() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput, 300);
  const [sortField, setSortField] = useState<PrincipleSortField>("sort_order");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Principle | null>(null);
  const [deleting, setDeleting] = useState<Principle | null>(null);

  const query = usePrinciples({ search, sortField, sortDirection, page, pageSize: PAGE_SIZE });

  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isEmpty = !query.isLoading && !query.isError && rows.length === 0 && !search;
  const isNoResults = !query.isLoading && !query.isError && rows.length === 0 && Boolean(search);

  function handleSort(field: PrincipleSortField) {
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

  function openEdit(p: Principle) {
    setEditing(p);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Principles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage Principles within each Level.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Principle
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
              placeholder="Search by framework, version, level, code, or name"
              aria-label="Search principles"
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
              {total} principle{total === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {query.isError && (
          <div className="border-b border-border bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Couldn't load principles</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {friendlyPrincipleError(query.error)}
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
            <SortHeader label="Version" field="version" activeField={sortField} direction={sortDirection} onSort={handleSort} />
          </div>
          <div className="col-span-1">
            <SortHeader label="Level" field="level" activeField={sortField} direction={sortDirection} onSort={handleSort} />
          </div>
          <div className="col-span-1">
            <SortHeader label="Code" field="code" activeField={sortField} direction={sortDirection} onSort={handleSort} />
          </div>
          <div className="col-span-2">
            <SortHeader label="Display Name" field="display_name" activeField={sortField} direction={sortDirection} onSort={handleSort} />
          </div>
          <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</div>
          <div className="col-span-1">
            <SortHeader label="Order" field="sort_order" activeField={sortField} direction={sortDirection} onSort={handleSort} />
          </div>
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
              <ListTree className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No principles yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create your first principle to start structuring a level.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create your first principle
            </button>
          </div>
        ) : isNoResults ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No results</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No principles match "{search}".
            </p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border">
            {rows.map((p) => {
              const lv = p.level;
              const fv = lv?.framework_version;
              return (
                <li key={p.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-sm">
                  {/* Mobile */}
                  <div className="col-span-12 flex items-start justify-between gap-3 md:hidden">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-mono text-muted-foreground">
                        {fv?.framework?.code ?? "—"} · v{fv?.version_number ?? "—"} · {lv?.code ?? "—"}
                      </p>
                      <p className="truncate font-medium text-foreground">
                        {p.code} — {p.display_name}
                      </p>
                      {p.description && (
                        <p className="truncate text-xs text-muted-foreground">{p.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        aria-label={`Edit ${p.code}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 hover:bg-accent hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(p)}
                        aria-label={`Delete ${p.code}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="col-span-2 hidden min-w-0 md:block">
                    <p className="truncate font-mono text-xs text-foreground">{fv?.framework?.code ?? "—"}</p>
                    <p className="truncate text-xs text-muted-foreground">{fv?.framework?.name ?? ""}</p>
                  </div>
                  <div className="col-span-1 hidden min-w-0 md:block">
                    <p className="truncate text-xs text-foreground">{fv?.version_number ?? "—"}</p>
                    <p className="truncate text-xs text-muted-foreground">{fv?.version_name ?? ""}</p>
                  </div>
                  <div className="col-span-1 hidden min-w-0 md:block">
                    <p className="truncate text-xs text-foreground">{lv?.code ?? "—"}</p>
                    <p className="truncate text-xs text-muted-foreground">{lv?.display_name ?? ""}</p>
                  </div>
                  <div className="col-span-1 hidden truncate font-mono text-xs text-foreground md:block">
                    {p.code}
                  </div>
                  <div className="col-span-2 hidden truncate font-medium text-foreground md:block">
                    {p.display_name}
                  </div>
                  <div className="col-span-2 hidden truncate text-xs text-muted-foreground md:block">
                    {p.description ?? "—"}
                  </div>
                  <div className="col-span-1 hidden text-xs text-foreground md:block">
                    {p.sort_order}
                  </div>
                  <div className="col-span-1 hidden text-xs text-muted-foreground md:block">
                    {formatDate(p.updated_at)}
                  </div>
                  <div className="col-span-1 hidden items-center justify-end gap-1 md:flex">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      aria-label={`Edit ${p.code}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 hover:bg-accent hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(p)}
                      aria-label={`Delete ${p.code}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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

      <PrincipleFormDialog open={formOpen} onOpenChange={setFormOpen} principle={editing} />
      <DeletePrincipleDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        principle={deleting}
      />
    </div>
  );
}