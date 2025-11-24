export type KnownSpeakers = {
  names: string[];
  references: string[];
};

const defaultSpeakerRefs = [
  { name: 'vish', path: '/vish.wav' },
  { name: 'sahil', path: '/sahil.wav' },
  { name: 'ben', path: '/ben.wav' },
];

let cachedKnownSpeakers: KnownSpeakers | null | undefined;

async function blobToDataUrl(blob: Blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:${blob.type || 'audio/wav'};base64,${base64}`;
}

/**
 * Attempts to load default known speaker reference clips from the public root.
 * If the files are missing, it silently returns null.
 */
export async function getDefaultKnownSpeakers(): Promise<KnownSpeakers | null> {
  if (typeof window === 'undefined') return null;
  if (cachedKnownSpeakers !== undefined) return cachedKnownSpeakers;

  const names: string[] = [];
  const references: string[] = [];

  for (const ref of defaultSpeakerRefs) {
    try {
      const response = await fetch(ref.path);
      if (!response.ok) continue;
      const blob = await response.blob();
      const dataUrl = await blobToDataUrl(blob);
      names.push(ref.name);
      references.push(dataUrl);
    } catch (error) {
      console.warn('Failed to load known speaker reference', ref.path, error);
    }
  }

  cachedKnownSpeakers = names.length ? { names, references } : null;
  return cachedKnownSpeakers;
}
