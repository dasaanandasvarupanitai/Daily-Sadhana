"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { DailySadhanaCard } from '@/components/DailySadhanaCard';
import { PreviousListeningsList } from '@/components/PreviousListeningsList';
import { TrackModal } from '@/components/TrackModal';
import { useAuth } from '@/lib/auth-context';
import { useTodayListening } from '@/lib/firestore';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { listening, submission, loading: dbLoading } = useTodayListening(user?.uid);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [submittedToday, setSubmittedToday] = useState(!!submission);

  // Update local state if DB state changes
  React.useEffect(() => {
    setSubmittedToday(!!submission);
  }, [submission]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <Loader2 className="animate-spin text-orange-500 w-12 h-12" />
      </div>
    );
  }

  // Handle local date string mapping
  const todayStr = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD' format broadly

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-orange-100/60 to-transparent -z-10" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl -z-10" />
      <div className="absolute top-60 -left-20 w-72 h-72 bg-red-100/40 rounded-full blur-3xl -z-10" />

      <Navbar onTrackClick={() => setIsTrackModalOpen(true)} />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 mb-20 z-0">
        
        {dbLoading ? (
          <div className="w-full flex justify-center py-20">
            <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
          </div>
        ) : (
          <>
            <DailySadhanaCard 
              listening={listening}
              publishedDateStr={todayStr}
              isToday={true}
              onSubmitted={() => setSubmittedToday(true)}
              alreadySubmitted={submittedToday}
            />

            <PreviousListeningsList />
          </>
        )}

      </main>

      {isTrackModalOpen && (
        <TrackModal onClose={() => setIsTrackModalOpen(false)} />
      )}

    </div>
  );
}
