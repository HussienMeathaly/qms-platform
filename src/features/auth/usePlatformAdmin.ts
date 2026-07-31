import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";

/**
 * A platform admin sees the full workspace (organizations, framework setup...).
 * Everyone else only sees the assessment journey.
 */
export function usePlatformAdmin() {
  const { user, isLoading } = useAuth();

  const query = useQuery({
    queryKey: ["platform-admin", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("app" as never)
        .from("platform_roles" as never)
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return ((data ?? []) as Array<{ role: string }>).some(
        (r) => r.role === "platform_admin",
      );
    },
  });

  return {
    isPlatformAdmin: query.data === true,
    isLoading: isLoading || (!!user && query.isLoading),
  };
}
