import { createFileRoute } from "@tanstack/react-router";
import { PlatformAdminOnly } from "@/features/auth/PlatformAdminOnly";
import { LevelsPage } from "../../pages/LevelsPage";

export const Route = createFileRoute("/_authenticated/levels")({
  head: () => ({
    meta: [
      { title: "Levels — QMS" },
      { name: "description", content: "Manage levels within framework versions." },
      { property: "og:title", content: "Levels — QMS" },
      { property: "og:description", content: "Manage levels within framework versions." },
    ],
  }),
  component: () => (
    <PlatformAdminOnly>
      <LevelsPage />
    </PlatformAdminOnly>
  ),
});