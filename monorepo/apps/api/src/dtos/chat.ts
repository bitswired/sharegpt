import { z } from "zod";

export const CreateChatInput = z.object({
  message: z.string().min(1),
});

export const AppendHumanMessageInput = z.object({
  chatId: z.number().int(),
  message: z.string().min(1),
});
