import { z } from 'zod';

export const ScoreRecordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  score: z.number().min(0).max(100),
  message: z.string(),
  imageUrl: z.string(), // Now accepts Base64 strings
  timestamp: z.string() // ISO string
});

export type ScoreRecord = z.infer<typeof ScoreRecordSchema>;
