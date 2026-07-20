import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be greater than 2 characters"),
  collegeId: z.string().min(1, "College Id must be greater than 1 characters"),
  password: z.string().min(8, "Password must be greater than 8 characters"),
});

const otpSchema = z.object({
  collegeId: z.string().min(1, "College Id must be greater than 1 characters"),
  otp: z.string().length(6, "OTP must be 6 characters"),
});

export type signupInput = z.infer<typeof signupSchema>;
export type otpInput = z.infer<typeof otpSchema>;
