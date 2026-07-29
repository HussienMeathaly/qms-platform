export type FrameworkVersionStatus = "draft" | "published" | "archived";

export type FrameworkRef = {
  id: string;
  code: string;
  name: string;
};

export type FrameworkVersion = {
  id: string;
  framework_id: string;
  version_number: string;
  version_name: string;
  description: string | null;
  status: FrameworkVersionStatus;
  published_at: string | null;
  effective_from: string | null;
  effective_to: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
  framework: FrameworkRef | null;
};

export type FrameworkVersionCreateInput = {
  framework_id: string;
  version_number: string;
  version_name: string;
  description: string | null;
  effective_from: string | null;
  effective_to: string | null;
};

export type FrameworkVersionUpdateInput = {
  framework_id: string;
  version_number: string;
  version_name: string;
  description: string | null;
  effective_from: string | null;
  effective_to: string | null;
};

export type FrameworkVersionSortField =
  | "framework"
  | "version_number"
  | "version_name"
  | "status"
  | "effective_from"
  | "updated_at";

export type SortDirection = "asc" | "desc";

export type ListFrameworkVersionsParams = {
  search?: string;
  sortField: FrameworkVersionSortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
};

export type ListFrameworkVersionsResult = {
  rows: FrameworkVersion[];
  total: number;
};