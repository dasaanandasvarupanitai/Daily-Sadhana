"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { usePreviousListenings, Listening } from '@/lib/firestore';
import { PlayCircle, Bookmark, Loader2, ChevronDown } from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function PreviousListeningsList() {
  const { user } = useAuth();
  const { listenings, loading, loadMore, hasMore } = usePreviousListenings(user?.uid);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  if (listenings.length === 0 && !loading) {
    return null; // Don't show the section if no previous listenings exist
  }

  const toggleBookmark = async (listening: Listening, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const docRef = doc(db, 'bookmarks', user.uid, 'userBookmarks', listening.id);
      const isBookmarked = bookmarkedIds.has(listening.id);
      if (isBookmarked) {
        await deleteDoc(docRef);
        setBookmarkedIds(prev => { const n = new Set(prev); n.delete(listening.id); return n; });
      } else {
        await setDoc(docRef, { ...listening, bookmarkedAt: new Date() });
        setBookmarkedIds(prev => { const n = new Set(prev); n.add(listening.id); return n; });
      }
    } catch (err) {
      console.error("Bookmarking failed", err);
    }
  };

  const displayDateStr = (rawDate: string) => {
    return new Date(rawDate + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 bg-white rounded-3xl shadow-sm border border-amber-100 overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-amber-50 bg-stone-50/50">
        <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
          Previous Listenings
        </h3>
        <p className="text-sm text-stone-500 mt-1">Catch up on older tracks you may have missed.</p>
      </div>

      <div className="flex flex-col">
        {listenings.map((item: { listening: Listening; publishedDate: string }, i: number) => (
          <a
            key={`${item.listening.id}-${i}`}
            href={item.listening.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 border-b border-stone-50 hover:bg-amber-50/50 transition-all"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold shadow-sm">
              #{item.listening.number}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-semibold text-stone-900 group-hover:text-amber-700 transition-colors line-clamp-2">
                {item.listening.title}
              </h4>
              <p className="text-sm text-stone-500 mt-0.5">
                {displayDateStr(item.publishedDate)}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-stone-100 sm:border-0 justify-between sm:justify-end">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleBookmark(item.listening, e);
                }}
                className={`p-2 rounded-full transition-all ${bookmarkedIds.has(item.listening.id) ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'text-stone-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent'}`}
              >
                <Bookmark size={18} fill={bookmarkedIds.has(item.listening.id) ? "currentColor" : "none"} strokeWidth={bookmarkedIds.has(item.listening.id) ? 1 : 2} />
              </button>
              
              <div className="flex items-center gap-2 text-sm font-medium text-stone-600 group-hover:text-red-500 transition-colors bg-white border border-stone-200 shadow-sm px-3 py-1.5 rounded-full">
                <PlayCircle size={16} /> Listen
              </div>
            </div>
          </a>
        ))}
      </div>

      {loading && (
        <div className="p-6 flex justify-center text-amber-600">
          <Loader2 className="animate-spin" />
        </div>
      )}

      {hasMore && !loading && (
        <button
          onClick={loadMore}
          className="w-full p-4 flex items-center justify-center gap-2 text-stone-600 font-medium hover:bg-stone-50 hover:text-amber-700 cursor-pointer transition-colors border-t border-amber-50"
        >
          Load More <ChevronDown size={18} />
        </button>
      )}
    </div>
  );
}
