'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { blobToWav } from '@/lib/audio/wav';
import { transcribeDiarized } from '@/lib/audio/transcribe-client';
import { getDefaultKnownSpeakers } from '@/lib/audio/known-speakers';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';

type VideoDevice = Pick<MediaDeviceInfo, 'deviceId' | 'label'>;

interface CapturedItem {
  image: string;
  transcript: string;
  timestamp: number;
}

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    startRecording,
    stopRecording,
    cancelRecording,
    isRecording,
    error: micError,
  } = useAudioRecorder();

  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mounted, setMounted] = useState(false);

  // State for transcription
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [saveWavCopy, setSaveWavCopy] = useState(false);
  const [lastWavUrl, setLastWavUrl] = useState<string | null>(null);

  // State for captured content
  const [lastCaptured, setLastCaptured] = useState<CapturedItem | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (micError) {
      setAudioError(micError);
    }
  }, [micError]);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        setDevices(
          mediaDevices
            .filter((device) => device.kind === 'videoinput')
            .map((device) => ({
              deviceId: device.deviceId,
              label: device.label || 'Camera',
            }))
        );
      } catch (error) {
        console.error('Failed to enumerate devices', error);
      }
    };

    loadDevices();
  }, []);

  const startSession = useCallback(async () => {
    try {
      setIsSessionActive(true);
      setAudioError(null);

      // Reset any prior recording
      cancelRecording();
      if (lastWavUrl) {
        URL.revokeObjectURL(lastWavUrl);
        setLastWavUrl(null);
      }

      // Start Camera
      stream?.getTracks().forEach((track) => track.stop());
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
        audio: false,
      });

      setStream(nextStream);
      if (videoRef.current) {
        videoRef.current.srcObject = nextStream;
        await videoRef.current.play();
      }

      setTranscript('');
      await startRecording();
    } catch (error) {
      console.error('Failed to start session', error);
      setIsSessionActive(false);
      setAudioError('Unable to start camera or microphone.');
    }
  }, [selectedDeviceId, stream, startRecording, cancelRecording, lastWavUrl]);

  const captureAndFlush = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isTranscribing) return;

    // Capture Photo
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoUrl = canvas.toDataURL('image/jpeg', 0.92);

    setAudioError(null);
    setIsTranscribing(true);
    try {
      const rawAudio = await stopRecording();
      const wavBlob = await blobToWav(rawAudio);

      if (saveWavCopy) {
        if (lastWavUrl) URL.revokeObjectURL(lastWavUrl);
        setLastWavUrl(URL.createObjectURL(wavBlob));
      }

      const knownSpeakers = await getDefaultKnownSpeakers();
      const result = await transcribeDiarized(wavBlob, {
        filename: 'camera.wav',
        knownSpeakerNames: knownSpeakers?.names,
        knownSpeakerReferences: knownSpeakers?.references,
      });

      const finalTranscript =
        result.diarizedText || result.text || '(No speech detected)';

      setLastCaptured({
        image: photoUrl,
        transcript: finalTranscript,
        timestamp: Date.now(),
      });

      setTranscript(finalTranscript);
    } catch (error) {
      console.error('Failed to capture turn', error);
      setAudioError('Failed to transcribe audio.');
    } finally {
      setIsTranscribing(false);
      if (isSessionActive) {
        try {
          await startRecording();
        } catch (err) {
          console.error('Failed to restart recording', err);
          setAudioError('Failed to restart microphone after capture.');
        }
      }
    }
  }, [
    isTranscribing,
    saveWavCopy,
    lastWavUrl,
    stopRecording,
    isSessionActive,
    startRecording,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (isSessionActive && !isTranscribing) {
          captureAndFlush();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [captureAndFlush, isSessionActive, isTranscribing]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
      cancelRecording();
      if (lastWavUrl) {
        URL.revokeObjectURL(lastWavUrl);
      }
    };
  }, [stream, cancelRecording, lastWavUrl]);

  if (!mounted) return null;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Continuity Camera & Transcription</h1>
        <p className="text-sm text-muted-foreground">
          Start the session to enable camera capture and GPT-4o diarized transcription. Press
          spacebar to capture the current frame and transcribe the recorded audio.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium">
            Camera
            <select
              className="ml-2 rounded border px-3 py-1 text-sm"
              value={selectedDeviceId}
              onChange={(event) => setSelectedDeviceId(event.target.value)}
            >
              <option value="">Default</option>
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
            onClick={startSession}
          >
            {isSessionActive ? 'Restart Session' : 'Start Session'}
          </button>
          <button
            type="button"
            className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            onClick={captureAndFlush}
            disabled={!isSessionActive || isTranscribing}
          >
            {isTranscribing ? 'Transcribing…' : 'Capture (spacebar)'}
          </button>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={saveWavCopy}
              onChange={(event) => setSaveWavCopy(event.target.checked)}
            />
            Save WAV copy before upload
          </label>
          {audioError && (
            <span className="text-xs text-red-500">{audioError}</span>
          )}
          {saveWavCopy && lastWavUrl && (
            <a
              className="text-xs text-blue-600 underline"
              href={lastWavUrl}
              download="camera-transcription.wav"
            >
              Download last WAV
            </a>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
            {/* Live Feed */}
            <div className="flex flex-col gap-2">
                <h2 className="font-medium text-sm">Live Feed</h2>
                <div className="aspect-video overflow-hidden rounded border bg-black/5 relative">
                    <video ref={videoRef} className="size-full object-contain" playsInline />

                    {/* Live Transcript Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm min-h-[3rem]">
                        <div className="flex justify-between text-xs text-gray-300 mb-1">
                            <span>Diarized Transcript</span>
                            <span>{new Date().toLocaleTimeString()}</span>
                        </div>
                        <p>
                          {isTranscribing
                            ? 'Transcribing...'
                            : isRecording
                              ? 'Recording audio...'
                              : transcript || 'No transcript yet'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Last Captured */}
            <div className="flex flex-col gap-2">
                <h2 className="font-medium text-sm">Last Captured</h2>
                <div className="aspect-video overflow-hidden rounded border bg-black/5 flex flex-col">
                    {lastCaptured ? (
                    <>
                        <div className="flex-1 overflow-hidden relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={lastCaptured.image} alt="Captured frame" className="size-full object-contain" />
                        </div>
                        <div className="bg-white border-t p-3 text-sm h-1/3 overflow-y-auto">
                             <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Captured Transcript</span>
                                <span>{new Date(lastCaptured.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p>{lastCaptured.transcript || "(No speech detected)"}</p>
                        </div>
                    </>
                    ) : (
                    <div className="flex items-center justify-center size-full">
                        <span className="text-sm text-muted-foreground">Capture will appear here</span>
                    </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
