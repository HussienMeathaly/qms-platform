import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "../pages/DashboardPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — QMS" },
      { name: "description", content: "Quality Management System dashboard." },
      { property: "og:title", content: "Dashboard — QMS" },
      { property: "og:description", content: "Quality Management System dashboard." },
    ],
  }),
  component: DashboardPage,
});
