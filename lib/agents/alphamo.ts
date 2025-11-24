import { Experimental_Agent as Agent, stepCountIs } from 'ai';
import { google } from '@ai-sdk/google';
import { sum } from '@/lib/tools/sum';
import { addPlayer } from '@/lib/tools/add-player';
import { updatePlayerMoney } from '@/lib/tools/update-player-money';
import { addProperty } from '@/lib/tools/add-property';
import { removeProperty } from '@/lib/tools/remove-property';
import { updateProperty } from '@/lib/tools/update-property';
import { getMemoryBank } from '@/lib/tools/get-memory-bank';
import { buildSystemPrompt } from '@/lib/prompts/alphamo';

export async function createAlphamoAgent() {
  const systemPrompt = await buildSystemPrompt();
  
  return new Agent({
    model: google('gemini-2.5-flash'),
    system: systemPrompt,
    tools: {
      sum,
      addPlayer,
      updatePlayerMoney,
      addProperty,
      removeProperty,
      updateProperty,
      getMemoryBank,
    },
    stopWhen: stepCountIs(20),
  });
}
