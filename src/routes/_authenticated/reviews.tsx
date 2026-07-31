import { createFileRoute } from "@tanstack/react-router";
import { PlatformAdminOnly } from "@/features/auth/PlatformAdminOnly";
import { ReviewsPage } from "../../pages/ReviewsPage";

export const Route = createFileRoute("/_authenticated/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews — QMS" },
      { name: "description", content: "Consultant reviews." },
      { property: "og:title", content: "Reviews — QMS" },
      { property: "og:description", content: "Consultant reviews." },
    ],
  }),
  component: () => (
    <PlatformAdminOnly>
      <ReviewsPage />
    </PlatformAdminOnly>
  ),
});