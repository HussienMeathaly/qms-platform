import type { ResponseTypeOption, WorkspaceRequirement } from "./types";

export type ResultGroup = {
  key: string;
  code: string | null;
  name: string;
  /** null when nothing graded yet */
  percent: number | null;
  graded: number;
  total: number;
};

/** Stable key for a principle, deduplicated across levels. */
function principleKey(req: WorkspaceRequirement) {
  return (
    (req.principle_code || "").trim().toLowerCase() ||
    (req.principle_name || "").trim().toLowerCase() ||
    "unassigned"
  );
}

export type ScoreScale = {
  index: Map<string, number>;
  max: number;
  ordered: ResponseTypeOption[];
};

export function buildScale(types: ResponseTypeOption[]): ScoreScale {
  const ordered = [...types].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const index = new Map<string, number>();
  // Prefer the numeric score stored in the database; fall back to position.
  ordered.forEach((t, i) => index.set(t.id, typeof t.score === "number" ? t.score : i));
  const values = Array.from(index.values());
  const max = values.length > 0 ? Math.max(...values) : 1;
  return { index, max: max > 0 ? max : 1, ordered };
}

/** 0..1 score of a requirement based on its graded criteria, or null when ungraded. */
export function requirementScore(
  req: WorkspaceRequirement,
  scale: ScoreScale,
): number | null {
  const graded = req.criteria
    .map((c) => (c.response_type_id ? scale.index.get(c.response_type_id) : undefined))
    .filter((v): v is number => typeof v === "number");
  if (graded.length === 0) return null;
  return graded.reduce((a, b) => a + b, 0) / graded.length / scale.max;
}

export function requirementGradedCount(req: WorkspaceRequirement) {
  return req.criteria.filter((c) => c.response_type_id).length;
}

function finalize(map: Map<string, { g: ResultGroup; scores: number[] }>): ResultGroup[] {
  return Array.from(map.values()).map(({ g, scores }) => ({
    ...g,
    percent:
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)
        : null,
  }));
}

export type Band = "not_started" | "partial" | "substantial" | "strong" | "weak";

export function bandFor(overall: number | null, minPrinciple: number | null): Band {
  if (overall === null) return "not_started";
  const floor = minPrinciple ?? overall;
  if (overall >= 70 && floor >= 70) return "strong";
  if (overall >= 50 && floor >= 50) return "substantial";
  if (overall >= 30) return "partial";
  return "weak";
}

export const BAND_LABEL: Record<Band, string> = {
  not_started: "Not started",
  weak: "Weak",
  partial: "Partial",
  substantial: "Substantial",
  strong: "Strong",
};

export function buildResults(requirements: WorkspaceRequirement[], scale: ScoreScale) {
  const clauses = new Map<string, { g: ResultGroup; scores: number[] }>();
  const principles = new Map<string, { g: ResultGroup; scores: number[] }>();
  const allScores: number[] = [];
  let graded = 0;
  let total = 0;

  for (const req of requirements) {
    const score = requirementScore(req, scale);
    const reqGraded = requirementGradedCount(req);
    graded += reqGraded;
    total += req.criteria.length;
    if (score !== null) allScores.push(score);

    const pKey = principleKey(req);
    const p =
      principles.get(pKey) ??
      {
        g: {
          key: pKey,
          code: req.principle_code,
          name: req.principle_name || "Unassigned Principle",
          percent: null,
          graded: 0,
          total: 0,
        },
        scores: [] as number[],
      };
    p.g.graded += reqGraded;
    p.g.total += req.criteria.length;
    if (score !== null) p.scores.push(score);
    principles.set(pKey, p);

    const list = req.process_clauses.length > 0 ? req.process_clauses : [];
    for (const pc of list) {
      const c =
        clauses.get(pc.id) ??
        {
          g: {
            key: pc.id,
            code: pc.code,
            name: pc.display_name,
            percent: null,
            graded: 0,
            total: 0,
          },
          scores: [] as number[],
        };
      c.g.graded += reqGraded;
      c.g.total += req.criteria.length;
      if (score !== null) c.scores.push(score);
      clauses.set(pc.id, c);
    }
  }

  const principleGroups = finalize(principles);
  const clauseGroups = finalize(clauses).sort((a, b) =>
    (a.code ?? a.name).localeCompare(b.code ?? b.name, undefined, { numeric: true }),
  );
  const overall =
    allScores.length > 0
      ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100)
      : null;
  const scored = principleGroups
    .map((p) => p.percent)
    .filter((v): v is number => typeof v === "number");
  const minPrinciple = scored.length > 0 ? Math.min(...scored) : null;

  return {
    clauses: clauseGroups,
    principles: principleGroups,
    overall,
    graded,
    total,
    band: bandFor(overall, minPrinciple),
  };
}

/** Requirements grouped under their primary process clause, in clause order. */
export type PrincipleNode = ResultGroup & {
  sort: number;
  items: WorkspaceRequirement[];
};

export type LevelNode = ResultGroup & {
  sort: number;
  principles: PrincipleNode[];
};

function pct(scores: number[]) {
  return scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)
    : null;
}

/** Levels → principles (deduped by code) → requirements, with scores on each node. */
export function buildOutline(
  requirements: WorkspaceRequirement[],
  scale: ScoreScale,
): LevelNode[] {
  const levels = new Map<
    string,
    { node: LevelNode; scores: number[]; principles: Map<string, { node: PrincipleNode; scores: number[] }> }
  >();

  for (const req of requirements) {
    const lKey = req.level_id ?? req.level_name ?? "unassigned-level";
    let level = levels.get(lKey);
    if (!level) {
      level = {
        node: {
          key: lKey,
          code: req.level_code,
          name: req.level_name || "Unassigned Level",
          percent: null,
          graded: 0,
          total: 0,
          sort: req.level_sort ?? 999,
          principles: [],
        },
        scores: [],
        principles: new Map(),
      };
      levels.set(lKey, level);
    }

    const pKey =
      (req.principle_code || "").trim().toLowerCase() ||
      (req.principle_name || "").trim().toLowerCase() ||
      "unassigned";
    let principle = level.principles.get(pKey);
    if (!principle) {
      principle = {
        node: {
          key: `${lKey}:${pKey}`,
          code: req.principle_code,
          name: req.principle_name || "Unassigned Principle",
          percent: null,
          graded: 0,
          total: 0,
          sort: req.principle_sort ?? 999,
          items: [],
        },
        scores: [],
      };
      level.principles.set(pKey, principle);
    }

    const score = requirementScore(req, scale);
    const g = requirementGradedCount(req);
    const t = req.criteria.length;
    level.node.graded += g;
    level.node.total += t;
    principle.node.graded += g;
    principle.node.total += t;
    if (score !== null) {
      level.scores.push(score);
      principle.scores.push(score);
    }
    principle.node.items.push(req);
  }

  return Array.from(levels.values())
    .map(({ node, scores, principles }) => ({
      ...node,
      percent: pct(scores),
      principles: Array.from(principles.values())
        .map(({ node: p, scores: s }) => ({
          ...p,
          percent: pct(s),
          items: p.items.sort((a, b) => a.sort_order - b.sort_order),
        }))
        .sort((a, b) => a.sort - b.sort || (a.code ?? a.name).localeCompare(b.code ?? b.name)),
    }))
    .sort((a, b) => a.sort - b.sort || (a.code ?? a.name).localeCompare(b.code ?? b.name));
}

/** Requirements grouped under their primary process clause, in clause order. */
export function groupByClause(requirements: WorkspaceRequirement[]) {
  const map = new Map<
    string,
    { id: string; code: string | null; name: string; sort: number; items: WorkspaceRequirement[] }
  >();
  for (const req of requirements) {
    const pc = req.process_clauses[0];
    const key = pc?.id ?? "unassigned";
    const group =
      map.get(key) ??
      {
        id: key,
        code: pc?.code ?? null,
        name: pc?.display_name ?? "Unassigned",
        sort: pc?.sort_order ?? 999,
        items: [] as WorkspaceRequirement[],
      };
    group.items.push(req);
    map.set(key, group);
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      a.sort - b.sort ||
      (a.code ?? a.name).localeCompare(b.code ?? b.name, undefined, { numeric: true }),
  );
}