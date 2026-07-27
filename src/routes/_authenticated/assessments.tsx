import { createFileRoute } from "@tanstack/react-router";
import { AssessmentsPage } from "../../pages/AssessmentsPage";

export const Route = createFileRoute("/_authenticated/assessments")({
  head: () => ({
    meta: [
      { title: "Assessments — QMS" },
      { name: "description", content: "Manage assessments." },
      { property: "og:title", content: "Assessments — QMS" },
      { property: "og:description", content: "Manage assessments." },
    ],
  }),
  component: AssessmentsPage,
});