import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — QMS" },
      { name: "description", content: "Set a new password for your QMS account." },
      { property: "og:title", content: "Reset password — QMS" },
      { property: "og:description", content: "Set a new password for your QMS account." },
    ],
  }),
  component: ResetPasswordPage,
});