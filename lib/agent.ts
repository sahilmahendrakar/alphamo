import { Experimental_Agent as Agent } from 'ai';
import { google } from '@ai-sdk/google';

export const agent = new Agent({
  model: google('gemini-2.5-flash-lite'),
  system: 'You are a helpful assistant.',
});

