import { Layers, ListChecks, Workflow } from "lucide-react";
import type { ProgressGroup } from "./progress";

function Bar({ percent }: { percent: number }) {
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all ${
          percent === 100 ? "bg-primary" : "bg-primary/70"
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function GroupCard({
  title,
  icon,
  groups,
}: {
  title: string;
  icon: React.ReactNode;
  groups: ProgressGroup[];
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      </div>
      {groups.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">No data available.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {groups.map((g) => (
            <li key={g.key}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm text-foreground">
                  {g.code ? (
                    <span className="text-muted-foreground">{g.code} · </span>
                  ) : null}
                  {g.name}
                </p>
                <p className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                  {g.completed}/{g.total} · {g.percent}%
                </p>
              </div>
              <div className="mt-1.5">
                <Bar percent={g.percent} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProgressBreakdown({
  levels,
  principles,
  processClauses,
}: {
  levels: ProgressGroup[];
  principles: ProgressGroup[];
  processClauses: ProgressGroup[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <GroupCard title="Levels" icon={<Layers className="h-4 w-4" />} groups={levels} />
      <GroupCard
        title="Principles"
        icon={<ListChecks className="h-4 w-4" />}
        groups={principles}
      />
      <GroupCard
        title="Process Clauses"
        icon={<Workflow className="h-4 w-4" />}
        groups={processClauses}
      />
    </div>
  );
}
