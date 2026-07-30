export type ResponseTypeOption = {
  id: string;
  code: string;
  display_name: string;
  description: string | null;
  color: string | null;
  sort_order: number;
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

export type WorkspaceRequirement = {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  sort_order: number;
  level_code: string | null;
  level_name: string;
  level_sort: number;
  principle_code: string | null;
  principle_name: string;
  principle_sort: number;
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