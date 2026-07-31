import { createFileRoute } from "@tanstack/react-router";
import { PlatformAdminOnly } from "@/features/auth/PlatformAdminOnly";
import { ProcessClausesPage } from "../../pages/ProcessClausesPage";

export const Route = createFileRoute("/_authenticated/process-clauses")({
  head: () => ({
    meta: [
      { title: "Process Clauses — QMS" },
      {
        name: "description",
        content: "Manage process clauses within each framework version.",
      },
      { property: "og:title", content: "Process Clauses — QMS" },
      {
        property: "og:description",
        content: "Manage process clauses within each framework version.",
      },
    ],
  }),
  component: () => (
    <PlatformAdminOnly>
      <ProcessClausesPage />
    </PlatformAdminOnly>
  ),
});