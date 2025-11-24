'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type VideoDevice = Pick<MediaDeviceInfo, 'deviceId' | 'label'>;

interface CapturedItem {
  image: string;
  transcript: string;
  timestamp: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

// specific types for SpeechRecognition
interface SpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
  resultIndex: number;
  // error property is usually on the error event, not result event
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSessionActiveRef = useRef(false);

  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mounted, setMounted] = useState(false);

  // State for transcription
  const [transcript, setTranscript] = useState('');
  const [fullTranscript, setFullTranscript] = useState(''); // To track full history for offsetting
  const [flushedLength, setFlushedLength] = useState(0);

  // State for captured content
  const [lastCaptured, setLastCaptured] = useState<CapturedItem | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Update the ref when state changes
  useEffect(() => {
    isSessionActiveRef.current = isSessionActive;
  }, [isSessionActive]);

  useEffect(() => {
    setMounted(true);

    // Initialize Speech Recognition if available
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionConstructor) {
        const recognition = new SpeechRecognitionConstructor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          // Let's reconstruct full text from all results to be safe about indices
          let allText = '';
          for (let i = 0; i < event.results.length; i++) {
            allText += event.results[i][0].transcript;
          }
          setFullTranscript(allText);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error', event.error);
          if (event.error === 'not-allowed') {
             isSessionActiveRef.current = false;
             setIsSessionActive(false);
          }
        };

        recognition.onend = () => {
            if (isSessionActiveRef.current) {
                console.log('Speech recognition ended, restarting...');
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Failed to restart recognition", e);
                }
            }
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Calculate the visible (unflushed) transcript
  useEffect(() => {
    setTranscript(fullTranscript.slice(flushedLength));
  }, [fullTranscript, flushedLength]);

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

      // Start Camera
      stream?.getTracks().forEach((track) => track.stop());
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
        audio: false, // We use SpeechRecognition for audio/text
      });

      setStream(nextStream);
      if (videoRef.current) {
        videoRef.current.srcObject = nextStream;
        await videoRef.current.play();
      }

      // Start Speech Recognition
      if (recognitionRef.current) {
        // Reset transcripts
        setFullTranscript('');
        setFlushedLength(0);
        setTranscript('');

        try {
             recognitionRef.current.start();
        } catch (e: unknown) {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((e as any).name !== 'InvalidStateError' && (e as any).message?.indexOf('already started') === -1) {
                 console.error("Error starting recognition", e);
            }
        }
      }

    } catch (error) {
      console.error('Failed to start session', error);
      setIsSessionActive(false);
    }
  }, [selectedDeviceId, stream]);

  const captureAndFlush = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

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

    // Capture Transcript (the part that hasn't been flushed yet)
    const currentTranscript = fullTranscript.slice(flushedLength);

    // Set Captured Item
    setLastCaptured({
      image: photoUrl,
      transcript: currentTranscript,
      timestamp: Date.now(),
    });

    // Flush Transcript
    setFlushedLength(fullTranscript.length);

  }, [fullTranscript, flushedLength]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        captureAndFlush();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [captureAndFlush]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
      isSessionActiveRef.current = false; // Prevent restart on unmount
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [stream]);

  if (!mounted) return null;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Continuity Camera & Transcription</h1>
        <p className="text-sm text-muted-foreground">
          Start the session to enable camera and speech recognition. Press spacebar to capture the current frame and transcript.
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
            disabled={!isSessionActive}
          >
            Capture (spacebar)
          </button>
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
                            <span>Live Transcript</span>
                            <span>{new Date().toLocaleTimeString()}</span>
                        </div>
                        <p>{transcript || "Listening..."}</p>
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
