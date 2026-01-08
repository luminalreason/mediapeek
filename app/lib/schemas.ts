import { z } from 'zod';

export const analyzeSchema = z.object({
  url: z.url({ message: 'Please provide a valid URL.' }),
  format: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .toLowerCase()
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    )
    .pipe(z.array(z.enum(['json', 'text', 'xml', 'html', 'all', 'object']))),
});

export type AnalyzeInput = z.infer<typeof analyzeSchema>;
