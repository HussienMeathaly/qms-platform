import { createFileRoute } from "@tanstack/react-router";
import { UnauthorizedPage } from "../pages/UnauthorizedPage";

export const Route = createFileRoute("/unauthorized")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Access denied — QMS" },
      { name: "description", content: "You do not have access to this resource." },
      { property: "og:title", content: "Access denied — QMS" },
      { property: "og:description", content: "You do not have access to this resource." },
    ],
  }),
  component: UnauthorizedPage,
});