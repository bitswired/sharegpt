import { z } from "zod";

export const SignupInput = z.object({
  name: z.string().min(3).max(255),
  password: z.string().min(4).max(255),
  secret: z.string(),
});

export const LoginInput = z.object({
  name: z.string().min(3).max(255),
  password: z.string().min(4).max(255),
});
