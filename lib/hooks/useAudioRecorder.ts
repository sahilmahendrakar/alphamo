'use client';

import { useCallback, useRef, useState } from 'react';

interface AudioRecorderState {
  isRecording: boolean;
  error: string | null;
}

/**
 * Small hook around MediaRecorder to capture microphone audio.
 * Returns start/stop helpers and exposes recording/error state.
 */
export function useAudioRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [{ isRecording, error }, setState] = useState<AudioRecorderState>({
    isRecording: false,
    error: null,
  });

  const resetState = useCallback((next: Partial<AudioRecorderState>) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  const startRecording = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }

    if (isRecording) return;

    resetState({ error: null });

    if (!navigator.mediaDevices?.getUserMedia) {
      resetState({ error: 'Audio recording is not supported in this browser.' });
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      resetState({ error: 'MediaRecorder is not available in this environment.' });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      console.info('[AudioRecorder] Microphone stream acquired');

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Clean up the stream tracks once recording stops.
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        console.info('[AudioRecorder] Recording stopped and stream released');
      };

      recorderRef.current = recorder;
      recorder.start();
      console.info('[AudioRecorder] Recording started');
      resetState({ isRecording: true });
    } catch (err: unknown) {
      console.error('Failed to start audio recording', err);
      resetState({
        error: 'Microphone permission was denied or unavailable.',
        isRecording: false,
      });
      throw err;
    }
  }, [isRecording, resetState]);

  const stopRecording = useCallback(() => {
    return new Promise<Blob>((resolve, reject) => {
      const recorder = recorderRef.current;
      if (!recorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      const handleStop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;

        resetState({ isRecording: false });
        console.info('[AudioRecorder] Recording finalized (blob ready)');

        resolve(blob);
      };

      recorder.onstop = () => {
        recorder.onstop = null;
        handleStop();
        // Underlying tracks are cleaned up in the start handler's onstop.
      };

      try {
        recorder.stop();
      } catch (err) {
        resetState({ error: 'Failed to stop recording.', isRecording: false });
        reject(err);
      }
    });
  }, [resetState]);

  const cancelRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;

    recorder.ondataavailable = null;
    recorder.onstop = null;
    try {
      recorder.stop();
    } catch (err) {
      console.warn('Error while cancelling recorder', err);
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    resetState({ isRecording: false });
  }, [resetState]);

  return {
    startRecording,
    stopRecording,
    cancelRecording,
    isRecording,
    error,
  };
}
