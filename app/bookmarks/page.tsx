"use client";

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { TrackModal } from '@/components/TrackModal';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { Loader2, Bookmark as BookmarkIcon, PlayCircle, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<{ id: string; url: string; number: number; title: string; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  useEffect(() => {
    async function loadBookmarks() {
      if (!user) return;
      try {
        const q = query(collection(db, 'bookmarks', user.uid, 'userBookmarks'), orderBy('bookmarkedAt', 'desc'));
        const snap = await getDocs(q);
        const bms = snap.docs.map(d => ({ id: d.id, ...d.data() } as { id: string; url: string; number: number; title: string; [key: string]: any }));
        setBookmarks(bms);
      } catch (err) {
        console.error("Failed to load bookmarks", err);
      } finally {
        setLoading(false);
      }
    }
    loadBookmarks();
  }, [user]);

  const removeBookmark = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'bookmarks', user.uid, 'userBookmarks', id));
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error("Failed to remove bookmark", err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <Loader2 className="animate-spin text-orange-500 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#faf8f5]">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-orange-100/40 to-transparent -z-10" />

      <Navbar onTrackClick={() => setIsTrackModalOpen(true)} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 mb-20 z-0">
        
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition-colors mb-4 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
            <ArrowLeft size={16} /> Back to Today
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <BookmarkIcon className="text-orange-500" fill="currentColor" /> 
            Saved Listenings
          </h1>
          <p className="text-gray-500 mt-2">Your personal collection of inspired classes and talks.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-orange-50 text-orange-300 rounded-full flex items-center justify-center mb-4">
              <BookmarkIcon size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No bookmarks yet</h3>
            <p className="text-gray-500 max-w-sm mt-2">
              When you find a listening you&apos;d like to revisit, tap the bookmark icon to save it here.
            </p>
            <Link href="/" className="mt-6 px-6 py-2 bg-orange-50 text-orange-600 font-semibold rounded-full hover:bg-orange-100 transition-colors">
              Go to Daily Sadhana
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {bookmarks.map(bm => (
              <a 
                key={bm.id} 
                href={bm.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-3 gap-2">
                  <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full">
                    #{bm.number}
                  </span>
                  <button 
                    onClick={(e) => removeBookmark(bm.id, e)}
                    className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                    title="Remove Bookmark"
                  >
                    <BookmarkIcon size={16} fill="currentColor" />
                  </button>
                </div>
                
                <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-3 mb-4 flex-1">
                  {bm.title}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium pt-3 border-t border-gray-50 mt-auto">
                  <PlayCircle size={16} className="text-red-500" />
                  Listen on YouTube
                  <ExternalLink size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            ))}
          </div>
        )}

      </main>

      {isTrackModalOpen && (
        <TrackModal onClose={() => setIsTrackModalOpen(false)} />
      )}

    </div>
  );
}
