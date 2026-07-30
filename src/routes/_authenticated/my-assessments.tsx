import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/my-assessments")({
  component: MyAssessmentsLayout,
});

function MyAssessmentsLayout() {
  return <Outlet />;
}
