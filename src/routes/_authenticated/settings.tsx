import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "../../pages/SettingsPage";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — QMS" },
      { name: "description", content: "Application settings." },
      { property: "og:title", content: "Settings — QMS" },
      { property: "og:description", content: "Application settings." },
    ],
  }),
  component: SettingsPage,
});