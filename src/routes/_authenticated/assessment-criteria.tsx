import { createFileRoute } from "@tanstack/react-router";
import { PlatformAdminOnly } from "@/features/auth/PlatformAdminOnly";
import { AssessmentCriteriaPage } from "../../pages/AssessmentCriteriaPage";

export const Route = createFileRoute("/_authenticated/assessment-criteria")({
  head: () => ({
    meta: [
      { title: "Assessment Criteria — QMS" },
      {
        name: "description",
        content: "Manage assessment criteria within requirements.",
      },
      { property: "og:title", content: "Assessment Criteria — QMS" },
      {
        property: "og:description",
        content: "Manage assessment criteria within requirements.",
      },
    ],
  }),
  component: () => (
    <PlatformAdminOnly>
      <AssessmentCriteriaPage />
    </PlatformAdminOnly>
  ),
});