import { createFileRoute } from "@tanstack/react-router";
import { FrameworkVersionsPage } from "../../pages/FrameworkVersionsPage";

export const Route = createFileRoute("/_authenticated/framework-versions")({
  head: () => ({
    meta: [
      { title: "Framework Versions — QMS" },
      { name: "description", content: "Manage versions of assessment frameworks." },
      { property: "og:title", content: "Framework Versions — QMS" },
      { property: "og:description", content: "Manage versions of assessment frameworks." },
    ],
  }),
  component: FrameworkVersionsPage,
});