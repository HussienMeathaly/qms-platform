import { createFileRoute } from "@tanstack/react-router";
import { ReviewsPage } from "../pages/ReviewsPage";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews — QMS" },
      { name: "description", content: "Consultant reviews." },
      { property: "og:title", content: "Reviews — QMS" },
      { property: "og:description", content: "Consultant reviews." },
    ],
  }),
  component: ReviewsPage,
});