import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  AlertCircle,
  Users,
} from "lucide-react";
import { useOrganizations } from "./hooks";
import type {
  Organization,
  OrganizationSortField,
  SortDirection,
} from "./types";
import { OrganizationFormDialog } from "./OrganizationFormDialog";
import { DeleteOrganizationDialog } from "./DeleteOrganizationDialog";
import { OrganizationMembersDialog } from "./OrganizationMembersDialog";
import { friendlyOrganizationError } from "./service";
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

function formatDate(iso: string): string {
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

function StatusBadge({ status }: { status: Organization["status"] }) {
  const active = status === "active";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        active
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-muted-foreground/60",
        )}
      />
      {active ? "Active" : "Inactive"}
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
  field: OrganizationSortField;
  activeField: OrganizationSortField;
  direction: SortDirection;
  onSort: (f: OrganizationSortField) => void;
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
        <div key={i} className="grid grid-cols-12 items-center gap-4 px-4 py-3">
          <div className="col-span-2 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-4 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-2 h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="col-span-2 h-4 animate-pulse rounded bg-muted" />
          <div className="col-span-2 h-4 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function OrganizationsView() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput, 300);
  const [sortField, setSortField] = useState<OrganizationSortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [deleting, setDeleting] = useState<Organization | null>(null);
  const [managingMembers, setManagingMembers] = useState<Organization | null>(null);

  const query = useOrganizations({
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

  function handleSort(field: OrganizationSortField) {
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

  function openEdit(org: Organization) {
    setEditing(org);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Organizations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage donor organizations on the platform.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New organization
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or code"
              aria-label="Search organizations"
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
              {total} organization{total === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {query.isError && (
          <div className="border-b border-border bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Couldn't load organizations</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {friendlyOrganizationError(query.error)}
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

        <div className="hidden grid-cols-12 gap-4 border-b border-border bg-muted/40 px-4 py-2.5 md:grid">
          <div className="col-span-2">
            <SortHeader label="Code" field="code" activeField={sortField} direction={sortDirection} onSort={handleSort} />
          </div>
          <div className="col-span-4">
            <SortHeader label="Name" field="name" activeField={sortField} direction={sortDirection} onSort={handleSort} />
          </div>
          <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </div>
          <div className="col-span-2">
            <SortHeader label="Created" field="created_at" activeField={sortField} direction={sortDirection} onSort={handleSort} />
          </div>
          <div className="col-span-1">
            <SortHeader label="Updated" field="updated_at" activeField={sortField} direction={sortDirection} onSort={handleSort} />
          </div>
          <div className="col-span-1 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Actions
          </div>
        </div>

        {query.isLoading ? (
          <TableSkeleton />
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No organizations yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first organization to start managing assessments and evidence.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create your first organization
            </button>
          </div>
        ) : isNoResults ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No results</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No organizations match "{search}".
            </p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border">
            {rows.map((org) => (
              <li key={org.id} className="grid grid-cols-12 items-center gap-4 px-4 py-3 text-sm">
                <div className="col-span-12 flex items-center justify-between gap-3 md:hidden">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{org.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{org.code}</p>
                  </div>
                  <StatusBadge status={org.status} />
                </div>
                <div className="col-span-12 flex items-center justify-between gap-2 md:hidden">
                  <p className="text-xs text-muted-foreground">
                    Created {formatDate(org.created_at)} · Updated {formatDate(org.updated_at)}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setManagingMembers(org)}
                      aria-label={`Manage members of ${org.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 hover:bg-accent hover:text-foreground"
                    >
                      <Users className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(org)}
                      aria-label={`Edit ${org.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 hover:bg-accent hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(org)}
                      aria-label={`Delete ${org.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="col-span-2 hidden truncate font-mono text-xs text-foreground md:block">
                  {org.code}
                </div>
                <div className="col-span-4 hidden truncate font-medium text-foreground md:block">
                  {org.name}
                </div>
                <div className="col-span-2 hidden md:block">
                  <StatusBadge status={org.status} />
                </div>
                <div className="col-span-2 hidden text-muted-foreground md:block">
                  {formatDate(org.created_at)}
                </div>
                <div className="col-span-1 hidden text-muted-foreground md:block">
                  {formatDate(org.updated_at)}
                </div>
                <div className="col-span-1 hidden items-center justify-end gap-1 md:flex">
                  <button
                    type="button"
                    onClick={() => setManagingMembers(org)}
                    aria-label={`Manage members of ${org.name}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 hover:bg-accent hover:text-foreground"
                  >
                    <Users className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(org)}
                    aria-label={`Edit ${org.name}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 hover:bg-accent hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(org)}
                    aria-label={`Delete ${org.name}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
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

      <OrganizationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        organization={editing}
      />
      <DeleteOrganizationDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        organization={deleting}
      />
      <OrganizationMembersDialog
        open={Boolean(managingMembers)}
        onOpenChange={(open) => !open && setManagingMembers(null)}
        organization={managingMembers}
      />
    </div>
  );
}