import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured on the server.' },
      { status: 500 }
    );
  }

  let tempAudioPath: string | null = null;

  try {
    const incomingForm = await request.formData();
    const file = incomingForm.get('audio');
    const knownSpeakerNames = incomingForm.getAll('known_speaker_names').map(String);
    const knownSpeakerReferences = incomingForm.getAll('known_speaker_references').map(String);

    console.info('[Transcribe API] Incoming request', {
      knownSpeakers: Math.min(knownSpeakerNames.length, knownSpeakerReferences.length),
    });

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing audio file.' }, { status: 400 });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tempDir = path.join(process.cwd(), 'tmp');

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    tempAudioPath = path.join(tempDir, `audio-${timestamp}.wav`);
    const audioBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tempAudioPath, audioBuffer);

    console.info('[Transcribe API] Saved temp audio file', { path: tempAudioPath });

    const config = {
      audio_path: tempAudioPath,
      known_speakers: {
        names: knownSpeakerNames,
        references: knownSpeakerReferences.map((ref, i) => {
          const refPath = path.join(tempDir, `ref-${timestamp}-${i}.wav`);
          const match = ref.match(/^data:audio\/wav;base64,(.+)$/);
          if (match) {
            fs.writeFileSync(refPath, Buffer.from(match[1], 'base64'));
          }
          return refPath;
        })
      }
    };

    console.info('[Transcribe API] Calling Python transcription script');

    const pythonScript = path.join(process.cwd(), 'transcribe-diarize.py');
    const { stdout, stderr } = await execFileAsync('python3', [
      pythonScript,
      JSON.stringify(config)
    ], {
      env: { ...process.env, OPENAI_API_KEY: process.env.OPENAI_API_KEY }
    });

    if (stderr) {
      console.error('[Python stderr]', stderr);
    }

    const result = JSON.parse(stdout);

    if (result.error) {
      throw new Error(`Python script error: ${result.error}`);
    }

    console.log('\n=== Transcription Complete ===');
    if (result.segments && Array.isArray(result.segments)) {
      result.segments.forEach((segment: { speaker?: string; text?: string }) => {
        if (segment.speaker && segment.text) {
          console.log(`${segment.speaker}: ${segment.text}`);
        }
      });
    }
    console.log('=============================\n');

    fs.unlinkSync(tempAudioPath);
    config.known_speakers.references.forEach(ref => {
      if (fs.existsSync(ref)) {
        fs.unlinkSync(ref);
      }
    });

    return NextResponse.json({ result });
  } catch (error: unknown) {
    if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      fs.unlinkSync(tempAudioPath);
    }

    console.error('Transcription route failed', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: (error as Error).message },
      { status: 500 }
    );
  }
}
