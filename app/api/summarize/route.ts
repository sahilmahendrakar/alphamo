import { NextResponse } from 'next/server';
import { createSummarizerAgent } from '@/lib/agents/summarizer';

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();
    
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Invalid transcript provided' },
        { status: 400 }
      );
    }

    const agent = await createSummarizerAgent();
    
    const response = await agent.respond({
      messages: [
        {
          role: 'user',
          content: transcript,
        },
      ],
    });

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    let summary = '';
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('0:')) {
          const json = JSON.parse(line.slice(2));
          if (json.type === 'text-delta' && json.textDelta) {
            summary += json.textDelta;
          }
        }
      }
    }

    return NextResponse.json({ summary: summary.trim() });
  } catch (error) {
    console.error('Summarization failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to summarize transcript',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

