import { Experimental_Agent as Agent, stepCountIs } from 'ai';
import { google } from '@ai-sdk/google';
import { buildSummarizerPrompt } from '@/lib/prompts/summarizer';

export async function createSummarizerAgent() {
  const systemPrompt = buildSummarizerPrompt();
  
  return new Agent({
    model: google('gemini-2.5-flash-lite'),
    system: systemPrompt,
    tools: {},
    stopWhen: stepCountIs(1),
  });
}

