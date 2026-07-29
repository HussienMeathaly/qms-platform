import { createFileRoute } from "@tanstack/react-router";
import { PrinciplesPage } from "../../pages/PrinciplesPage";

export const Route = createFileRoute("/_authenticated/principles")({
  head: () => ({
    meta: [
      { title: "Principles — QMS" },
      { name: "description", content: "Manage principles within levels." },
      { property: "og:title", content: "Principles — QMS" },
      { property: "og:description", content: "Manage principles within levels." },
    ],
  }),
  component: PrinciplesPage,
});