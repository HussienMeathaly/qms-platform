export type OrganizationStatus = "active" | "inactive";

export type Organization = {
  id: string;
  code: string;
  name: string;
  status: OrganizationStatus;
  created_at: string;
  updated_at: string;
};

export type OrganizationInput = {
  code: string;
  name: string;
  status: OrganizationStatus;
};

export type OrganizationSortField = "code" | "name" | "created_at" | "updated_at";
export type SortDirection = "asc" | "desc";

export type ListOrganizationsParams = {
  search?: string;
  sortField: OrganizationSortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
};

export type ListOrganizationsResult = {
  rows: Organization[];
  total: number;
};