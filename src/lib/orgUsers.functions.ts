import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().trim().email().max(255),
  fullName: z.string().trim().min(1).max(150),
  jobTitle: z.string().trim().max(150).nullable().optional(),
  role: z.enum(["org_admin", "org_contributor", "viewer"]),
});

export const createOrgUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { createOrgUserImpl } = await import("./orgUsers.server");
    return createOrgUserImpl({
      organizationId: data.organizationId,
      email: data.email,
      fullName: data.fullName,
      jobTitle: data.jobTitle?.trim() ? data.jobTitle.trim() : null,
      role: data.role,
    });
  });

const updateSchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  fullName: z.string().trim().min(1).max(150),
  jobTitle: z.string().trim().max(150).nullable().optional(),
  role: z.enum(["org_admin", "org_contributor", "viewer"]),
});

export const updateOrgUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data }) => {
    const { updateOrgUserImpl } = await import("./orgUsers.server");
    return updateOrgUserImpl({
      organizationId: data.organizationId,
      userId: data.userId,
      fullName: data.fullName,
      jobTitle: data.jobTitle?.trim() ? data.jobTitle.trim() : null,
      role: data.role,
    });
  });

const removeSchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const removeOrgUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => removeSchema.parse(data))
  .handler(async ({ data }) => {
    const { removeOrgUserImpl } = await import("./orgUsers.server");
    return removeOrgUserImpl(data);
  });
