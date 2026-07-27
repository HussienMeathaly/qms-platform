import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LoginPage } from "../pages/LoginPage";

type AuthSearch = { redirect?: string };

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const dest = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/";
      throw redirect({ to: dest });
    }
  },
  head: () => ({
    meta: [
      { title: "Sign in — QMS" },
      { name: "description", content: "Sign in to the Quality Management System." },
      { property: "og:title", content: "Sign in — QMS" },
      { property: "og:description", content: "Sign in to the Quality Management System." },
    ],
  }),
  component: LoginPage,
});