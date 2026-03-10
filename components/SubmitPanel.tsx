"use client";

import React, { useState, useEffect } from 'react';
import { AudioRecorder } from './AudioRecorder';
import { getDraft, saveDraft, clearDraft, DraftData } from '@/lib/local-storage';
import { Paperclip, Loader2, X, CheckCircle2 } from 'lucide-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

interface SubmitPanelProps {
  listeningNumber: number;
  publishedDateStr: string;
  onSubmitted: () => void;
  alreadySubmitted: boolean;
}

export function SubmitPanel({ listeningNumber, publishedDateStr, onSubmitted, alreadySubmitted }: SubmitPanelProps) {
  const { user } = useAuth();
  
  const [draft, setDraft] = useState<DraftData>({
    text: '',
    audioBlob: null,
    fileBlob: null,
    fileName: null,
    fileMimeType: null,
  });
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (alreadySubmitted) return;
    
    // Load draft when listeningNumber changes
    async function load() {
      setLoading(true);
      const data = await getDraft(listeningNumber);
      setDraft(data);
      setLoading(false);
    }
    load();
  }, [listeningNumber, alreadySubmitted]);

  // Debounce saving text
  useEffect(() => {
    if (loading || alreadySubmitted) return;
    const timer = setTimeout(() => {
      saveDraft(listeningNumber, draft);
    }, 1000);
    return () => clearTimeout(timer);
  }, [draft, listeningNumber, loading, alreadySubmitted]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft((prev: DraftData) => ({ ...prev, text: e.target.value }));
  };

  const handleAudioComplete = (blob: Blob | null) => {
    setDraft((prev: DraftData) => ({ ...prev, audioBlob: blob }));
    saveDraft(listeningNumber, { audioBlob: blob });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setDraft((prev: DraftData) => ({
        ...prev,
        fileBlob: file,
        fileName: file.name,
        fileMimeType: file.type
      }));
      saveDraft(listeningNumber, { 
        fileBlob: file, 
        fileName: file.name, 
        fileMimeType: file.type 
      });
    }
  };

  const removeFile = () => {
    setDraft((prev: DraftData) => ({ ...prev, fileBlob: null, fileName: null, fileMimeType: null }));
    saveDraft(listeningNumber, { fileBlob: null, fileName: null, fileMimeType: null });
  };

  const handleSubmit = async () => {
    if (!user) return alert("Must be logged in.");
    if (!draft.text.trim() && !draft.audioBlob && !draft.fileBlob) {
      return alert("Please add some text, an audio note, or a file before submitting.");
    }

    setIsSubmitting(true);
    try {
      // Create submisison metadata
      // The submissions ID can be random or a combined ID. Let's use a combined ID so we can't double-submit easily if we want.
      // But firestore rules say we can create/update.
      const docId = `${user.uid}_${listeningNumber}_${publishedDateStr}`;
      
      await setDoc(doc(db, 'submissions', docId), {
        userId: user.uid,
        listeningNumber: listeningNumber,
        publishedDate: publishedDateStr,
        submitted: true,
        timestamp: serverTimestamp()
      });

      // Clear local draft data intentionally
      await clearDraft(listeningNumber);
      
      onSubmitted();

    } catch (err) {
      console.error("Submission failed", err);
      alert("Failed to submit. Check permissions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (alreadySubmitted) {
    return (
      <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-200 flex flex-col items-center justify-center gap-2 text-center my-4">
        <CheckCircle2 size={32} className="text-green-500" />
        <h3 className="font-semibold text-lg">Sadhana Submitted</h3>
        <p className="text-sm opacity-80">You have completed today&apos;s listening. Haribol!</p>
      </div>
    );
  }

  if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm mt-4 flex flex-col gap-4">
      <h3 className="font-semibold text-gray-800 border-b pb-2">Submit Your Reflection</h3>
      
      <textarea
        value={draft.text}
        onChange={handleTextChange}
        placeholder="Write your reflection, notes, or realizations here..."
        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none resize-y min-h-[100px] text-sm"
      />
      
      <AudioRecorder 
        onRecordingComplete={handleAudioComplete} 
        initialBlob={draft.audioBlob} 
      />

      <div className="flex flex-col gap-2">
        {draft.fileName ? (
          <div className="flex items-center justify-between p-2 border rounded-lg bg-gray-50 text-sm">
            <span className="truncate flex items-center gap-2">
              <Paperclip size={14} className="text-gray-400"/>
              {draft.fileName}
            </span>
            <button onClick={removeFile} className="text-red-500 p-1 hover:bg-red-50 rounded">
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer text-sm text-gray-600 transition">
            <Paperclip size={16} />
            <span>Attach Photo or File</span>
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>
        )}
      </div>

      <p className="text-xs text-gray-400 px-1 italic">
        * Note: Audio and files are saved securely on your device only. They are not uploaded to the cloud.
      </p>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || (!draft.text.trim() && !draft.audioBlob && !draft.fileBlob)}
        className="mt-2 w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] flex justify-center items-center gap-2"
      >
        {isSubmitting ? <><Loader2 size={18} className="animate-spin"/> Submitting...</> : 'Submit Sadhana'}
      </button>
    </div>
  );
}
