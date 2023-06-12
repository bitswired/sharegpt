import { z } from "zod";

export const CreateLiveSessionInput = z.object({
  name: z.string().min(3).max(255),
});
