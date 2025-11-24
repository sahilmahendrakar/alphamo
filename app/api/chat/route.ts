import { validateUIMessages } from 'ai';
import { agent } from '@/lib/agent';

export async function POST(request: Request) {
  const { messages } = await request.json();
  
  return agent.respond({
    messages: await validateUIMessages({ messages }),
  });
}

