import { z } from "zod";

export const freeChatDraftSchema = z.object({
  context: z.string().min(1, "Context is required"),
  title: z.string().optional(),
  userRole: z.string().optional(),
  aiRole: z.string().optional(),
});

export type FreeChatDraftInput = z.infer<typeof freeChatDraftSchema>;
