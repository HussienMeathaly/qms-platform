import { createFileRoute } from "@tanstack/react-router";
import { OrganizationsPage } from "../pages/OrganizationsPage";

export const Route = createFileRoute("/organizations")({
  head: () => ({
    meta: [
      { title: "Organizations — QMS" },
      { name: "description", content: "Manage organizations." },
      { property: "og:title", content: "Organizations — QMS" },
      { property: "og:description", content: "Manage organizations." },
    ],
  }),
  component: OrganizationsPage,
});