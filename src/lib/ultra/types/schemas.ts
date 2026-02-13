import { z } from 'zod';
import type { DocumentId, UserId, Money } from './branded';

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fileName: z.string().min(1).max(500),
  fileType: z.enum(['pdf', 'png', 'jpg', 'jpeg']),
  fileSize: z
    .number()
    .min(0)
    .max(100 * 1024 * 1024),
  documentDate: z.coerce.date(),
  type: z.enum(['RECHNUNG', 'QUITTUNG', 'KAUFBELEG', 'LOHNABRECHNUNG']),
  totalAmount: z.number().min(0).max(1000000),
  vatAmount: z.number().min(0).max(200000),
  netAmount: z.number().min(0).max(800000),
  creditor: z.string().min(1).max(200),
  vatRate: z.number().min(0).max(100),
  iban: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'processing', 'processed', 'error']),
  aiConfidence: z.number().min(0).max(100).optional(),
  ocrEngine: z.enum(['nvidia', 'siliconflow', 'mistral', 'opencode']).optional(),
  processingTime: z.number().optional(),
  uploadedAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Document = z.infer<typeof DocumentSchema>;
