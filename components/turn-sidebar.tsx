import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';
import { blobToWav } from '@/lib/audio/wav';
import { transcribeDiarized } from '@/lib/audio/transcribe-client';
import { getDefaultKnownSpeakers } from '@/lib/audio/known-speakers';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';

type VideoDevice = Pick<MediaDeviceInfo, 'deviceId' | 'label'>;

export interface CapturedItem {
  image: string;
  transcript: string;
  timestamp: number;
}

interface TurnSidebarProps {
  onCapture?: (item: CapturedItem) => void;
}

export function TurnSidebar({ onCapture }: TurnSidebarProps) {
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

  // State for transcription
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [saveWavCopy, setSaveWavCopy] = useState(false);
  const [lastWavUrl, setLastWavUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // State for captured content
  const [isSessionActive, setIsSessionActive] = useState(false);

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
      cancelRecording();
      if (lastWavUrl) {
        URL.revokeObjectURL(lastWavUrl);
        setLastWavUrl(null);
      }

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

  const stopSession = useCallback(() => {
      setIsSessionActive(false);
      stream?.getTracks().forEach((track) => track.stop());
      cancelRecording();
  }, [stream, cancelRecording]);

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
        filename: 'turn.wav',
        knownSpeakerNames: knownSpeakers?.names,
        knownSpeakerReferences: knownSpeakers?.references,
      });

      const currentTranscript =
        result.diarizedText || result.text || '(No speech detected)';

      const item: CapturedItem = {
        image: photoUrl,
        transcript: currentTranscript,
        timestamp: Date.now(),
      };

      if (onCapture) {
        onCapture(item);
      }

      setTranscript(currentTranscript);
    } catch (error) {
      console.error('Failed to transcribe turn audio', error);
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
    onCapture,
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

  return (
    <div className="flex flex-col h-full border-l border-gray-200 bg-[#F3F4F6]">

       {/* Camera Selection - Minimal */}
       <div className="p-3 shrink-0">
            <select
                className="bg-transparent border-none text-xs text-gray-400 focus:outline-none w-full cursor-pointer hover:text-gray-600 transition-colors"
                value={selectedDeviceId}
                onChange={(event) => setSelectedDeviceId(event.target.value)}
            >
                <option value="">Default Camera</option>
                {devices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                    </option>
                ))}
            </select>
       </div>

       {/* Content Area */}
       <div className="flex-1 px-4 pb-4 min-h-0 flex flex-col gap-4">

            {/* Live Monitor - Smaller Fixed Height */}
            <div className="h-48 bg-black rounded-xl overflow-hidden relative shadow-sm ring-1 ring-black/5 shrink-0">
                {isSessionActive ? (
                    <video ref={videoRef} className="size-full object-cover" playsInline muted />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-2 bg-gray-100">
                        <div className="p-3 rounded-full bg-gray-200">
                             <Square className="w-6 h-6 text-gray-400" />
                        </div>
                        <span className="text-sm font-medium">Camera Off</span>
                    </div>
                )}
            </div>

            {/* Live Transcript Area - Takes remaining space */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col min-h-0">
                 <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 tracking-wider">Live Transcript</h4>
                 <div className="flex-1 overflow-y-auto text-sm leading-relaxed text-gray-700">
                    {isTranscribing
                      ? 'Transcribing...'
                      : isRecording
                        ? 'Recording audio...'
                        : transcript || (
                            <span className="text-gray-400 italic">
                              No transcript yet. Press Play Turn to capture and transcribe.
                            </span>
                          )}
                 </div>
                 {audioError && (
                   <p className="text-xs text-red-500 mt-2">{audioError}</p>
                 )}
            </div>

            {/* Play Turn Button */}
            <div className="shrink-0 mt-auto">
                 {!isSessionActive ? (
                     <Button
                        size="lg"
                        className="w-full h-14 text-lg font-semibold rounded-xl shadow-sm bg-black hover:bg-gray-800 text-white transition-all"
                        onClick={startSession}
                    >
                        <Play className="w-5 h-5 mr-2 fill-current" />
                        Start Session
                     </Button>
                 ) : (
                     <Button
                        size="lg"
                        variant="default"
                        className="w-full h-14 text-lg font-semibold rounded-xl shadow-blue-200 shadow-lg bg-blue-600 hover:bg-blue-700 text-white transition-all border-t border-white/20"
                        onClick={captureAndFlush}
                        disabled={isTranscribing}
                    >
                        <div className="flex flex-col items-center leading-none gap-1">
                            <span>{isTranscribing ? 'Transcribing...' : 'Play Turn'}</span>
                            <span className="text-[10px] font-normal opacity-80 uppercase tracking-wider">Spacebar</span>
                        </div>
                     </Button>
                 )}

                 {isSessionActive && (
                     <div className="mt-3 flex items-center justify-between gap-2 text-xs text-gray-500">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={saveWavCopy}
                            onChange={(event) => setSaveWavCopy(event.target.checked)}
                          />
                          Save WAV copy before upload
                        </label>
                        {saveWavCopy && lastWavUrl && (
                          <a
                            className="text-blue-600 underline"
                            href={lastWavUrl}
                            download="turn-transcription.wav"
                          >
                            Download WAV
                          </a>
                        )}
                     </div>
                 )}

                 {isSessionActive && (
                     <button
                        onClick={stopSession}
                        className="w-full text-xs text-gray-400 hover:text-red-500 mt-3 font-medium transition-colors"
                     >
                        Stop Session
                     </button>
                 )}
            </div>
       </div>

       <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
