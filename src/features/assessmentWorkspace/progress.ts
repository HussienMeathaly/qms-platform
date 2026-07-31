import type { WorkspaceRequirement } from "./types";

export type ProgressGroup = {
  key: string;
  code: string | null;
  name: string;
  completed: number;
  total: number;
  percent: number;
};

function toGroups(map: Map<string, ProgressGroup>): ProgressGroup[] {
  return Array.from(map.values()).map((g) => ({
    ...g,
    percent: g.total > 0 ? Math.round((g.completed / g.total) * 100) : 0,
  }));
}

function counts(req: WorkspaceRequirement) {
  const total = req.criteria.length;
  const completed = req.criteria.filter((c) => c.status === "completed").length;
  return { total, completed };
}

export function requirementPercent(req: WorkspaceRequirement): number {
  const { total, completed } = counts(req);
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

export function requirementState(
  req: WorkspaceRequirement,
): "not_started" | "in_progress" | "completed" {
  const { total, completed } = counts(req);
  if (completed === 0) return "not_started";
  if (completed === total) return "completed";
  return "in_progress";
}

/** Progress aggregated by Level, Principle and Process Clause. */
export function buildProgressBreakdown(requirements: WorkspaceRequirement[]) {
  const levels = new Map<string, ProgressGroup>();
  const principles = new Map<string, ProgressGroup>();
  const clauses = new Map<string, ProgressGroup>();

  for (const req of requirements) {
    const { total, completed } = counts(req);

    const levelKey = req.level_id ?? req.level_name ?? "—";
    const level = levels.get(levelKey) ?? {
      key: levelKey,
      code: req.level_code,
      name: req.level_name || "Unassigned Level",
      completed: 0,
      total: 0,
      percent: 0,
    };
    level.completed += completed;
    level.total += total;
    levels.set(levelKey, level);

    const principleKey = req.principle_id ?? req.principle_name ?? "—";
    const principle = principles.get(principleKey) ?? {
      key: principleKey,
      code: req.principle_code,
      name: req.principle_name || "Unassigned Principle",
      completed: 0,
      total: 0,
      percent: 0,
    };
    principle.completed += completed;
    principle.total += total;
    principles.set(principleKey, principle);

    for (const pc of req.process_clauses) {
      const clause = clauses.get(pc.id) ?? {
        key: pc.id,
        code: pc.code,
        name: pc.display_name,
        completed: 0,
        total: 0,
        percent: 0,
      };
      clause.completed += completed;
      clause.total += total;
      clauses.set(pc.id, clause);
    }
  }

  return {
    levels: toGroups(levels),
    principles: toGroups(principles),
    processClauses: toGroups(clauses).sort((a, b) =>
      (a.code ?? a.name).localeCompare(b.code ?? b.name),
    ),
  };
}
