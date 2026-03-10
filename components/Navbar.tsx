"use client";

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Activity, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { useUserStreak } from '@/lib/firestore';

interface NavbarProps {
  onTrackClick: () => void;
}

export function Navbar({ onTrackClick }: NavbarProps) {
  const { user, loading: authLoading, signInWithGoogle, logout } = useAuth();
  const { streak } = useUserStreak(user?.uid);

  return (
    <nav className="sticky top-0 z-50 bg-[#FDFbf7]/90 backdrop-blur-md border-b border-amber-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Left: Branding */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-full bg-amber-100 overflow-hidden border-2 border-amber-300 shadow-[0_2px_10px_rgba(217,119,6,0.2)] flex-shrink-0 relative">
            <div className="absolute inset-0 flex justify-center items-center text-[10px] text-amber-800 font-bold bg-amber-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/SP.png" alt="SP" className="w-full h-full object-cover object-top" />
            </div>
          </div>
          <span className="font-extrabold text-xl text-stone-800 tracking-tight hidden sm:block group-hover:text-amber-700 transition-colors">
            Daily Sadhana
          </span>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-4">

          {authLoading ? (
            <div className="w-20 h-9 bg-stone-200/50 rounded-full animate-pulse"></div>
          ) : user ? (
            <>
              {/* Streak */}
              <div className="flex items-center gap-1.5 bg-white border border-amber-200 px-3 py-1.5 rounded-full shadow-sm" title="Current Streak">
                <span className="text-amber-600 font-bold text-sm">🔥 <span className="text-stone-700">{streak}</span></span>
              </div>

              {/* Track */}
              <button
                onClick={onTrackClick}
                className="p-2 sm:px-3 sm:py-2 flex items-center gap-2 text-stone-600 hover:text-amber-700 hover:bg-amber-50 rounded-full sm:rounded-lg font-medium text-sm transition-colors"
              >
                <Activity size={18} />
                <span className="hidden sm:block">Track</span>
              </button>

              {/* Bookmarks */}
              <Link href="/bookmarks" className="p-2 sm:px-3 sm:py-2 flex items-center gap-2 text-stone-600 hover:text-amber-700 hover:bg-amber-50 rounded-full sm:rounded-lg font-medium text-sm transition-colors">
                <Bookmark size={18} />
                <span className="hidden sm:block">Saved</span>
              </Link>

              {/* Avatar Dropdown (Simplified to just an avatar that signs out on click for MVP) */}
              <button
                onClick={logout}
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-amber-400 transition ml-1 shadow-sm"
                title="Sign Out"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="Avatar" className="w-full h-full object-cover" />
              </button>
            </>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 bg-white text-gray-800 border border-gray-300 shadow-sm px-4 py-2 rounded-full font-semibold hover:bg-gray-50 focus:ring-2 focus:ring-orange-200 transition text-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
              Sign in
            </button>
          )}

        </div>
      </div>
    </nav>
  );
}
