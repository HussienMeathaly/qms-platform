import type { Band, ResultGroup } from "./results";
import { BAND_LABEL } from "./results";

function ScoreRing({ percent }: { percent: number | null }) {
  const value = percent ?? 0;
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
        <circle cx="40" cy="40" r={r} className="fill-none stroke-muted" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={r}
          className="fill-none stroke-primary transition-all"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * value) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums text-foreground">
          {percent === null ? "—" : percent}
        </span>
        <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
          percent
        </span>
      </div>
    </div>
  );
}

export function ResultRows({ title, groups }: { title: string; groups: ResultGroup[] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      <ul className="mt-3 space-y-3">
        {groups.map((g) => (
          <li key={g.key}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-sm text-foreground">
                {g.code ? (
                  <span className="mr-1 font-mono text-xs text-muted-foreground">{g.code}</span>
                ) : null}
                {g.name}
              </p>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                {g.percent === null ? "–" : `${g.percent}%`}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${g.percent ?? 0}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {g.graded}/{g.total} graded
            </p>
          </li>
        ))}
        {groups.length === 0 && (
          <li className="text-xs text-muted-foreground">No data available.</li>
        )}
      </ul>
    </section>
  );
}

export function ResultsPanel({
  overall,
  band,
  graded,
  total,
  clauses,
  principles,
}: {
  overall: number | null;
  band: Band;
  graded: number;
  total: number;
  clauses: ResultGroup[];
  principles: ResultGroup[];
}) {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between bg-primary px-4 py-3">
          <h2 className="text-sm font-semibold text-primary-foreground">Results</h2>
          <span className="text-xs font-medium tabular-nums text-primary-foreground/80">
            {graded}/{total} graded
          </span>
        </div>
        <div className="flex items-center gap-4 p-4">
          <ScoreRing percent={overall} />
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-md bg-accent px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
              {BAND_LABEL[band]}
            </span>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Overall effectiveness score (provisional until every requirement is graded).
            </p>
          </div>
        </div>
        <p className="border-t border-border px-4 py-3 text-[11px] italic leading-relaxed text-muted-foreground">
          One grade per requirement, reflected in both result sets below. The band is gated by the
          weakest principle (Strong ≥ 70%; Substantial ≥ 50%; Partial ≥ 30%).
        </p>
      </section>

      <ResultRows title="Process performance results" groups={clauses} />
      <ResultRows title="Principle compliance results" groups={principles} />
    </div>
  );
}
