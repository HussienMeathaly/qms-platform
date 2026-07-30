import { createFileRoute } from "@tanstack/react-router";
import { MyAssessmentsPage } from "../../pages/MyAssessmentsPage";

export const Route = createFileRoute("/_authenticated/my-assessments")({
  head: () => ({
    meta: [
      { title: "My Assessments — QMS" },
      { name: "description", content: "Assessments assigned to you." },
      { property: "og:title", content: "My Assessments — QMS" },
      { property: "og:description", content: "Assessments assigned to you." },
    ],
  }),
  component: MyAssessmentsPage,
});