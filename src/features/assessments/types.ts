export type AssessmentRow = {
  id: string;
  status: string;
  created_at: string;
  organization_code: string;
  organization_name: string;
  framework_code: string;
  version_number: string;
  version_name: string;
  assigned_user: string;
  responses_count: number;
};

export type OrganizationOption = {
  id: string;
  code: string;
  name: string;
};

export type FrameworkVersionOption = {
  id: string;
  framework_code: string;
  version_number: string;
  version_name: string;
};

export type MemberOption = {
  id: string;
  full_name: string;
  job_title: string | null;
};

export type CreateAssessmentResult = {
  assessment_id: string;
  responses_created: number;
};