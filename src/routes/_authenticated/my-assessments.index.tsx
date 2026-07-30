import { createFileRoute } from "@tanstack/react-router";
import { MyAssessmentsPage } from "../../pages/MyAssessmentsPage";

export const Route = createFileRoute("/_authenticated/my-assessments/")({
  component: MyAssessmentsPage,
});
