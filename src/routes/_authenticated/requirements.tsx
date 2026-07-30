import { createFileRoute } from "@tanstack/react-router";
import { RequirementsPage } from "../../pages/RequirementsPage";

export const Route = createFileRoute("/_authenticated/requirements")({
  head: () => ({
    meta: [
      { title: "Requirements — QMS" },
      { name: "description", content: "Manage requirements within principles." },
      { property: "og:title", content: "Requirements — QMS" },
      { property: "og:description", content: "Manage requirements within principles." },
    ],
  }),
  component: RequirementsPage,
});