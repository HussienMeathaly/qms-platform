import { createFileRoute } from "@tanstack/react-router";
import { AssessmentWorkspacePage } from "../../pages/AssessmentWorkspacePage";

export const Route = createFileRoute("/_authenticated/my-assessments/$assessmentId")({
  head: () => ({
    meta: [
      { title: "Assessment Workspace — QMS" },
      { name: "description", content: "Answer your assigned assessment criteria." },
      { property: "og:title", content: "Assessment Workspace — QMS" },
      {
        property: "og:description",
        content: "Answer your assigned assessment criteria.",
      },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { assessmentId } = Route.useParams();
  return <AssessmentWorkspacePage assessmentId={assessmentId} />;
}