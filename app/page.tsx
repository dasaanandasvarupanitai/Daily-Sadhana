"use client";

import React, { useState, lazy, Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { DailySadhanaCard } from '@/components/DailySadhanaCard';
import { PreviousListeningsList } from '@/components/PreviousListeningsList';
import { useAuth } from '@/lib/auth-context';
import { useTodayListening } from '@/lib/firestore';
import { Loader2 } from 'lucide-react';

const TrackModal = lazy(() => import('@/components/TrackModal').then(m => ({ default: m.TrackModal })));

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { listening, submission, loading: dbLoading } = useTodayListening(user?.uid);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [submittedToday, setSubmittedToday] = useState(!!submission);

  // Update local state if DB state changes
  React.useEffect(() => {
    setSubmittedToday(!!submission);
  }, [submission]);

  // Handle local date string mapping
  const todayStr = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD' format broadly

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#FDFbf7]">

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-amber-100/70 via-orange-50/30 to-transparent -z-10" />
      <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-amber-200/30 rounded-full blur-3xl -z-10" />
      <div className="absolute top-60 -left-20 w-80 h-80 bg-rose-100/30 rounded-full blur-3xl -z-10" />

      <Navbar onTrackClick={() => setIsTrackModalOpen(true)} />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 mb-20 z-0">

        {dbLoading ? (
          <div className="w-full flex justify-center py-20">
            <Loader2 className="animate-spin text-amber-600 w-12 h-12" />
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
        <Suspense fallback={<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center"><Loader2 className="animate-spin text-white w-10 h-10" /></div>}>
          <TrackModal onClose={() => setIsTrackModalOpen(false)} />
        </Suspense>
      )}

    </div>
  );
}
