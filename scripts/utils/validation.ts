/**
 * Validation utilities using Zod
 */

import { z } from 'zod';

export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

export const safeValidate = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: z.ZodError } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};
