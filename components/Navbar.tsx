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
  const { user, signInWithGoogle, logout } = useAuth();
  const { streak } = useUserStreak(user?.uid);

  return (
    <nav className="sticky top-0 z-50 bg-[#faf8f5]/80 backdrop-blur-md border-b border-orange-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Left: Branding */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-orange-200 overflow-hidden border border-orange-300 shadow-inner flex-shrink-0 relative">
            {/* Using a placeholder SVG or img for Srila Prabhupada portrait per requirements */}
            <div className="absolute inset-0 flex justify-center items-center text-[10px] text-orange-800 font-bold bg-orange-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/A.C._Bhaktivedanta_Swami_Prabhupada_1972.jpg/151px-A.C._Bhaktivedanta_Swami_Prabhupada_1972.jpg" alt="SP" className="w-full h-full object-cover object-top grayscale-[30%] contrast-125" />
            </div>
          </div>
          <span className="font-extrabold text-xl text-gray-800 tracking-tight hidden sm:block group-hover:text-orange-600 transition-colors">
            Daily Sadhana
          </span>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {user ? (
            <>
              {/* Streak */}
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm" title="Current Streak">
                <span className="text-orange-500 font-bold">🔥 {streak}</span>
              </div>
              
              {/* Track */}
              <button 
                onClick={onTrackClick}
                className="p-2 sm:px-3 sm:py-2 flex items-center gap-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-full sm:rounded-lg font-medium text-sm transition"
              >
                <Activity size={18} />
                <span className="hidden sm:block">Track</span>
              </button>

              {/* Bookmarks */}
              <Link href="/bookmarks" className="p-2 sm:px-3 sm:py-2 flex items-center gap-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-full sm:rounded-lg font-medium text-sm transition">
                <Bookmark size={18} />
                <span className="hidden sm:block">Saved</span>
              </Link>
              
              {/* Avatar Dropdown (Simplified to just an avatar that signs out on click for MVP) */}
              <button 
                onClick={logout} 
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-red-400 transition ml-1"
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
