import { z } from "zod";

export const freeChatDraftSchema = z.object({
  context: z.string().min(1, "Context is required"),
  title: z.string().optional().nullable(),
  userRole: z.string().optional().nullable(),
  aiRole: z.string().optional().nullable(),
});

export type FreeChatDraftInput = z.infer<typeof freeChatDraftSchema>;
