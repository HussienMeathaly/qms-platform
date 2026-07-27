import { createFileRoute } from "@tanstack/react-router";
import { FrameworksPage } from "../../pages/FrameworksPage";

export const Route = createFileRoute("/_authenticated/frameworks")({
  head: () => ({
    meta: [
      { title: "Frameworks — QMS" },
      { name: "description", content: "Manage assessment frameworks." },
      { property: "og:title", content: "Frameworks — QMS" },
      { property: "og:description", content: "Manage assessment frameworks." },
    ],
  }),
  component: FrameworksPage,
});