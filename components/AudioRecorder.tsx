"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob | null) => void;
  initialBlob?: Blob | null;
}

export function AudioRecorder({ onRecordingComplete, initialBlob }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialBlob) {
      const url = URL.createObjectURL(initialBlob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [initialBlob]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingComplete(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // chunk every second just in case
      setIsRecording(true);
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Microphone access denied or not available.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const deleteRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDuration(0);
    onRecordingComplete(null);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (audioUrl) {
    return (
      <div className="flex flex-col gap-2 p-3 border rounded-lg bg-gray-50 border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Audio Recorded</span>
          <button 
            type="button" 
            onClick={deleteRecording}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <audio src={audioUrl} controls className="w-full h-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 border rounded-lg bg-gray-50 border-gray-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {isRecording ? (isPaused ? "Paused" : "Recording...") : "Record Audio Note"}
        </span>
        {isRecording && (
          <span className={`text-sm font-mono ${!isPaused ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
            {formatTime(duration)}
          </span>
        )}
      </div>
      
      <div className="flex gap-2">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition text-sm"
          >
            <Mic size={16} /> Start Recording
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                type="button"
                onClick={resumeRecording}
                className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition text-sm flex-1 justify-center"
              >
                <Play size={16} /> Resume
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseRecording}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition text-sm flex-1 justify-center"
              >
                <Pause size={16} /> Pause
              </button>
            )}
            
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition text-sm flex-1 justify-center"
            >
              <Square size={16} /> Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
