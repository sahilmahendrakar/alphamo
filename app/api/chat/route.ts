import { validateUIMessages } from 'ai';
import { createAlphamoAgent } from '@/lib/agents/alphamo';

export async function POST(request: Request) {
  const { messages } = await request.json();
  
  const agent = await createAlphamoAgent();
  
  return agent.respond({
    messages: await validateUIMessages({ messages }),
  });
}

