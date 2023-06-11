import { z } from "zod";

export const CreateChatInput = z.object({
  message: z.string().min(1),
});
