import { z } from 'zod';

export const matchSchema = z.object({
  fixtureId: z.string(),
  status: z.enum(['SCHEDULED', 'LIVE', 'COMPLETED']),
});
