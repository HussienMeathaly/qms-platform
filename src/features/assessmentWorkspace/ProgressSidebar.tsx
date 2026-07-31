import type { Band, LevelNode, ResultGroup } from "./results";
import { BAND_LABEL } from "./results";

function Ring({ percent }: { percent: number | null }) {
  const value = percent ?? 0;
  const r = 32;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle cx="40" cy="40" r={r} className="fill-none stroke-muted" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          className="fill-none stroke-primary transition-all duration-500"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * value) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold tabular-nums text-foreground">
          {percent === null ? "—" : `${percent}%`}
        </span>
      </div>
    </div>
  );
}

export function ProgressBar({
  group,
  emphasis = false,
  onClick,
}: {
  group: ResultGroup;
  emphasis?: boolean;
  onClick?: () => void;
}) {
  const complete = group.total > 0 && group.graded === group.total;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="w-full rounded-lg px-2 py-1.5 text-left transition-colors enabled:hover:bg-accent"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={`min-w-0 truncate ${emphasis ? "text-sm font-semibold text-foreground" : "text-[13px] text-foreground"}`}
        >
          {group.code ? (
            <span className="mr-1 font-mono text-[11px] text-muted-foreground">{group.code}</span>
          ) : null}
          {group.name}
        </span>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
          {group.percent === null ? "–" : `${group.percent}%`}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${complete ? "bg-primary" : "bg-primary/60"}`}
          style={{ width: `${group.percent ?? 0}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
        {group.graded}/{group.total} graded
      </p>
    </button>
  );
}

export function ProgressSidebar({
  overall,
  band,
  graded,
  total,
  levels,
  principles,
  clauses,
  onJump,
}: {
  overall: number | null;
  band: Band;
  graded: number;
  total: number;
  levels: LevelNode[];
  principles: ResultGroup[];
  clauses: ResultGroup[];
  onJump: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <Ring percent={overall} />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">Overall progress</h2>
            <span className="mt-1 inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground">
              {BAND_LABEL[band]}
            </span>
            <p className="mt-1 text-xs tabular-nums text-muted-foreground">
              {graded}/{total} criteria graded
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-3">
        <h3 className="px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Levels
        </h3>
        <ul className="mt-2 space-y-3">
          {levels.map((level) => (
            <li key={level.key}>
              <ProgressBar group={level} emphasis onClick={() => onJump(level.key)} />
              <ul className="mt-1 space-y-1 border-l border-border pl-2">
                {level.principles.map((p) => (
                  <li key={p.key}>
                    <ProgressBar group={p} onClick={() => onJump(p.key)} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-3">
        <h3 className="px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Principles
        </h3>
        <ul className="mt-2 space-y-2">
          {principles.map((p) => (
            <li key={p.key}>
              <ProgressBar group={p} />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-3">
        <h3 className="px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Process clauses
        </h3>
        <ul className="mt-2 space-y-2">
          {clauses.map((c) => (
            <li key={c.key}>
              <ProgressBar group={c} />
            </li>
          ))}
          {clauses.length === 0 && (
            <li className="px-2 text-xs text-muted-foreground">No data available.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
