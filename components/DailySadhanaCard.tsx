"use client";

import React, { useState, useEffect } from 'react';
import { Listening } from '@/lib/firestore';
import { Bookmark, Youtube, PlayCircle, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { SubmitPanel } from './SubmitPanel';

interface DailySadhanaCardProps {
  listening: Listening | null;
  publishedDateStr: string;
  isToday: boolean;
  onSubmitted?: () => void;
  alreadySubmitted?: boolean;
}

export function DailySadhanaCard({
  listening,
  publishedDateStr,
  isToday,
  onSubmitted,
  alreadySubmitted
}: DailySadhanaCardProps) {
  const { user } = useAuth();
  const [showVideo, setShowVideo] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  useEffect(() => {
    async function checkBookmark() {
      if (!user || !listening) return;
      try {
        const docRef = doc(db, 'bookmarks', user.uid, 'userBookmarks', listening.id);
        const snap = await getDoc(docRef);
        setBookmarked(snap.exists());
      } catch (err) {
        console.error("Failed to check bookmark", err);
      }
    }
    checkBookmark();
  }, [user, listening]);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !listening) return;
    setBookmarking(true);
    try {
      const docRef = doc(db, 'bookmarks', user.uid, 'userBookmarks', listening.id);
      if (bookmarked) {
        await deleteDoc(docRef);
        setBookmarked(false);
      } else {
        await setDoc(docRef, { ...listening, bookmarkedAt: new Date() });
        setBookmarked(true);
      }
    } catch (err) {
      console.error("Bookmarking failed", err);
    } finally {
      setBookmarking(false);
    }
  };

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\n]+)/);
    return match ? match[1] : null;
  };

  if (!listening) {
    return (
      <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center text-gray-500">
        <p className="font-semibold text-lg">Daily Sadhana hasn&apos;t started yet</p>
        <p className="text-sm">Check back on the start date.</p>
      </div>
    );
  }

  const videoId = extractVideoId(listening.url);
  const displayDateStr = new Date(publishedDateStr + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl bg-white border border-amber-100 shadow-[0_12px_40px_-12px_rgba(217,119,6,0.15)] overflow-hidden transition-all duration-300 relative">

      {/* Top soft accent bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-400"></div>

      {/* Header Area */}
      <div className="p-6 sm:p-8 flex flex-col gap-4 relative">
        <div className="flex justify-between items-start mt-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-amber-700 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Daily Sadhana
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 leading-tight">
              {isToday ? `Today's Listening` : `Listening for ${displayDateStr}`}
            </h2>
            <p className="text-stone-500 text-sm font-medium flex items-center gap-1.5">
              {displayDateStr}
            </p>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <span className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
              Track #{listening.number}
            </span>
            {isToday && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm border ${alreadySubmitted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200'
                }`}>
                {alreadySubmitted ? '✓ Submitted' : 'Published'}
              </span>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex gap-2 items-center mt-2">
          <button
            onClick={toggleBookmark}
            disabled={bookmarking}
            className={`p-2 rounded-full transition-all flex items-center justify-center shadow-sm border ${bookmarked ? 'bg-orange-50 text-orange-600 border-orange-500' : 'bg-white text-stone-400 border-orange-400 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50'}`}
            title="Bookmark"
          >
            {bookmarking ? <Loader2 size={18} className="animate-spin" /> : <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} strokeWidth={bookmarked ? 1 : 2} />}
          </button>

          <a
            href={listening.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center gap-2 justify-center py-2 px-4 bg-white border border-stone-200 shadow-sm rounded-full text-sm font-semibold text-stone-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
          >
            <Youtube size={18} className="text-red-500" /> Watch on YouTube
          </a>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 sm:px-8 pb-6 sm:pb-8">
        <h3 className="text-xl font-bold text-stone-800 mb-6 border-l-4 border-amber-400 pl-4 py-1 bg-gradient-to-r from-amber-50 to-transparent">{listening.title}</h3>

        {videoId ? (
          <div className="mt-4 rounded-xl overflow-hidden bg-black aspect-video relative group">
            {!showVideo ? (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => setShowVideo(true)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                  alt={listening.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <PlayCircle size={64} className="text-white relative z-10 drop-shadow-lg opacity-90 group-hover:scale-110 transition-transform" />
                <span className="text-white relative z-10 font-medium text-sm mt-2 drop-shadow-md bg-black/50 px-3 py-1 rounded-full">Play Embedded</span>
              </div>
            ) : (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title={listening.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0"
              ></iframe>
            )}
          </div>
        ) : (
          <div className="mt-4 p-4 bg-gray-100 rounded-xl text-center text-sm text-gray-500">
            No valid YouTube URL provided for preview.
          </div>
        )}

        {isToday && onSubmitted && (
          <SubmitPanel
            listeningNumber={listening.number}
            publishedDateStr={publishedDateStr}
            onSubmitted={onSubmitted}
            alreadySubmitted={alreadySubmitted || false}
          />
        )}
      </div>

    </div>
  );
}
