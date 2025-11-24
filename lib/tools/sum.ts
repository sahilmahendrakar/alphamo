import { tool } from 'ai';
import { z } from 'zod';

export const sum = tool({
  description: 'Add two numbers together',
  inputSchema: z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }),
  execute: async ({ a, b }) => ({
    result: a + b,
  }),
});

