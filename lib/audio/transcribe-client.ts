export type DiarizedSegment = {
  id?: string;
  type?: string;
  start?: number;
  end?: number;
  text: string;
  speaker?: string;
};

export type DiarizedTranscription = {
  text: string;
  diarizedText: string;
  segments?: DiarizedSegment[];
  raw: unknown;
};

export function formatDiarizedText(segments?: DiarizedSegment[], fallbackText?: string) {
  if (!segments || segments.length === 0) return fallbackText ?? '';

  return segments
    .map((segment) => {
      const speakerLabel = segment.speaker ?? 'Speaker';
      return `${speakerLabel}: ${segment.text?.trim() ?? ''}`.trim();
    })
    .join('\n');
}

export async function transcribeDiarized(
  blob: Blob,
  options?: {
    filename?: string;
    chunkingStrategy?: 'auto' | string;
    knownSpeakerNames?: string[];
    knownSpeakerReferences?: string[];
  }
): Promise<DiarizedTranscription> {
  const formData = new FormData();
  formData.append('audio', blob, options?.filename ?? 'audio.wav');
  formData.append('response_format', 'diarized_json');
  formData.append('chunking_strategy', options?.chunkingStrategy ?? 'auto');
  if (options?.knownSpeakerNames && options.knownSpeakerReferences) {
    const length = Math.min(
      options.knownSpeakerNames.length,
      options.knownSpeakerReferences.length
    );
    console.info('[Transcription] Attaching known speakers', {
      names: options.knownSpeakerNames.length,
      references: options.knownSpeakerReferences.length,
      used: length,
    });
    for (let i = 0; i < length; i++) {
      formData.append('known_speaker_names', options.knownSpeakerNames[i]);
      formData.append('known_speaker_references', options.knownSpeakerReferences[i]);
    }
  } else {
    console.warn('[Transcription] Known speakers missing or incomplete', {
      names: options?.knownSpeakerNames?.length ?? 0,
      references: options?.knownSpeakerReferences?.length ?? 0,
    });
  }

  console.info('[Transcription] Uploading audio', {
    filename: options?.filename ?? 'audio.wav',
    chunking_strategy: options?.chunkingStrategy ?? 'auto',
    known_speakers: options?.knownSpeakerNames?.length ?? 0,
  });

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  });

  console.info('[Transcription] Response received', {
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Transcription failed (${response.status}): ${errorText || response.statusText}`
    );
  }

  const json = await response.json();
  const payload = json.result ?? json;
  const segments = payload.segments as DiarizedSegment[] | undefined;
  const text = payload.text ?? '';
  const diarizedText = formatDiarizedText(segments, text);

  console.info('[Transcription] Completed', {
    segments: segments?.length ?? 0,
    textLength: diarizedText.length,
  });

  return {
    text,
    diarizedText: diarizedText || text,
    segments,
    raw: payload,
  };
}
