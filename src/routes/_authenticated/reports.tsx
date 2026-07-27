import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "../pages/ReportsPage";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — QMS" },
      { name: "description", content: "Reports and analytics." },
      { property: "og:title", content: "Reports — QMS" },
      { property: "og:description", content: "Reports and analytics." },
    ],
  }),
  component: ReportsPage,
});