import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Camera, CameraOff } from 'lucide-react';

type VideoDevice = Pick<MediaDeviceInfo, 'deviceId' | 'label'>;

export interface CapturedItem {
  image: string;
  transcript: string;
  timestamp: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

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

interface TurnSidebarProps {
  onCapture?: (item: CapturedItem) => void;
}

export function TurnSidebar({ onCapture }: TurnSidebarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSessionActiveRef = useRef(false);

  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  // State for transcription
  const [transcript, setTranscript] = useState('');
  const [fullTranscript, setFullTranscript] = useState('');
  const [flushedLength, setFlushedLength] = useState(0);

  // State for captured content
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Update the ref when state changes
  useEffect(() => {
    isSessionActiveRef.current = isSessionActive;
  }, [isSessionActive]);

  useEffect(() => {
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

      if (recognitionRef.current) {
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

  const stopSession = useCallback(() => {
      setIsSessionActive(false);
      stream?.getTracks().forEach((track) => track.stop());
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
  }, [stream]);

  const captureAndFlush = useCallback(() => {
    let photoUrl = '';

    if (isCameraEnabled && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          photoUrl = canvas.toDataURL('image/jpeg', 0.92);
        }
      }
    }

    const currentTranscript = fullTranscript.slice(flushedLength);

    const item: CapturedItem = {
      image: photoUrl,
      transcript: currentTranscript,
      timestamp: Date.now(),
    };

    if (onCapture) {
      onCapture(item);
    }

    setFlushedLength(fullTranscript.length);
  }, [fullTranscript, flushedLength, onCapture, isCameraEnabled]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (isSessionActive) {
            captureAndFlush();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [captureAndFlush, isSessionActive]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
      isSessionActiveRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [stream]);

  return (
    <div className="flex flex-col h-full border-l border-gray-200 bg-[#F3F4F6]">

       {/* Camera Controls */}
       <div className="p-3 shrink-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
                <select
                    className="bg-transparent border-none text-xs text-gray-400 focus:outline-none flex-1 cursor-pointer hover:text-gray-600 transition-colors"
                    value={selectedDeviceId}
                    onChange={(event) => setSelectedDeviceId(event.target.value)}
                    disabled={!isCameraEnabled}
                >
                    <option value="">Default Camera</option>
                    {devices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => setIsCameraEnabled(!isCameraEnabled)}
                    className={`p-1.5 rounded-md transition-colors ${
                        isCameraEnabled 
                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    }`}
                    title={isCameraEnabled ? "Disable camera" : "Enable camera"}
                >
                    {isCameraEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                </button>
            </div>
       </div>

       {/* Content Area */}
       <div className="flex-1 px-4 pb-4 min-h-0 flex flex-col gap-4">

            {/* Live Monitor - Smaller Fixed Height */}
            <div className="h-48 bg-black rounded-xl overflow-hidden relative shadow-sm ring-1 ring-black/5 shrink-0">
                {!isCameraEnabled ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-2 bg-gray-100">
                        <div className="p-3 rounded-full bg-gray-200">
                            <CameraOff className="w-6 h-6 text-gray-400" />
                        </div>
                        <span className="text-sm font-medium">Camera Disabled</span>
                    </div>
                ) : isSessionActive ? (
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
                    {transcript || <span className="text-gray-400 italic">Listening for speech...</span>}
                 </div>
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
                    >
                        <div className="flex flex-col items-center leading-none gap-1">
                            <span>Play Turn</span>
                            <span className="text-[10px] font-normal opacity-80 uppercase tracking-wider">Spacebar</span>
                        </div>
                     </Button>
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
