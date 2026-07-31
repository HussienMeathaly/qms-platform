export type ResponseTypeOption = {
  id: string;
  code: string;
  display_name: string;
  description: string | null;
  color: string | null;
  sort_order: number;
  /** Numeric maturity score from the database (0..3). */
  score: number | null;
};

export type WorkspaceCriterion = {
  response_id: string;
  criterion_id: string;
  code: string | null;
  title: string;
  description: string | null;
  sort_order: number;
  status: string;
  response_type_id: string | null;
};

export type WorkspaceProcessClause = {
  id: string;
  code: string | null;
  display_name: string;
  sort_order: number;
};

export type WorkspaceRequirement = {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  sort_order: number;
  level_id: string | null;
  level_code: string | null;
  level_name: string;
  level_sort: number;
  principle_id: string | null;
  principle_code: string | null;
  principle_name: string;
  principle_sort: number;
  process_clauses: WorkspaceProcessClause[];
  criteria: WorkspaceCriterion[];
};

export type WorkspaceData = {
  assessment_id: string;
  assessment_status: string;
  organization_name: string;
  framework_name: string;
  framework_code: string;
  version_number: string;
  requirements: WorkspaceRequirement[];
  total_count: number;
  completed_count: number;
};