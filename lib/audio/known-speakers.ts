export type KnownSpeakers = {
  names: string[];
  references: string[];
};

const defaultSpeakerRefs = [
  { name: 'ben', path: '/ben.wav' },
  { name: 'sahil', path: '/sahil.wav' },
  { name: 'vish', path: '/vish.wav' },
];

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

  if (names.length) {
    console.info('[KnownSpeakers] Loaded references', {
      count: names.length,
      names,
    });
  } else {
    console.warn('[KnownSpeakers] No speaker references could be loaded from public/');
  }

  return names.length ? { names, references } : null;
}
