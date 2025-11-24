import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured on the server.' },
      { status: 500 }
    );
  }

  try {
    const incomingForm = await request.formData();
    const file = incomingForm.get('audio');
    const responseFormat = (incomingForm.get('response_format') as string) ?? 'diarized_json';
    const chunkingStrategy = (incomingForm.get('chunking_strategy') as string) ?? 'auto';
    const knownSpeakerNames = incomingForm.getAll('known_speaker_names').map(String);
    const knownSpeakerReferences = incomingForm.getAll('known_speaker_references').map(String);
    console.info('[Transcribe API] Incoming request', {
      responseFormat,
      chunkingStrategy,
      knownSpeakers: Math.min(knownSpeakerNames.length, knownSpeakerReferences.length),
    });

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing audio file.' }, { status: 400 });
    }

    const openAiForm = new FormData();
    openAiForm.append('file', file, file.name || 'audio.wav');
    openAiForm.append('model', 'gpt-4o-transcribe-diarize');
    openAiForm.append('response_format', responseFormat);
    openAiForm.append('chunking_strategy', chunkingStrategy);
    for (let i = 0; i < Math.min(knownSpeakerNames.length, knownSpeakerReferences.length); i++) {
      openAiForm.append('known_speaker_names', knownSpeakerNames[i]);
      openAiForm.append('known_speaker_references', knownSpeakerReferences[i]);
    }

    const openAiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openAiForm,
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      return NextResponse.json(
        { error: 'OpenAI transcription request failed', details: errorText },
        { status: openAiResponse.status }
      );
    }

    const result = await openAiResponse.json();
    return NextResponse.json({ result });
  } catch (error: unknown) {
    console.error('Transcription route failed', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: (error as Error).message },
      { status: 500 }
    );
  }
}
