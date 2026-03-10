import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { getDailyListeningIndex, formatLocalDateString } from './schedule';

export { formatLocalDateString };

export interface Listening {
  id: string; // The doc ID usually matches the number as a string for easy lookup, but we'll store number too
  number: number;
  title: string;
  url: string;
  orderIndex: number;
}

export interface Submission {
  id?: string;
  userId: string;
  listeningNumber: number;
  publishedDate: string; // YYYY-MM-DD local
  submitted: boolean;
  timestamp: unknown;
}

export interface Config {
  startDate: string; // YYYY-MM-DD
}

// Global cache to avoid re-fetching the listening list constantly
let cachedListenings: Listening[] | null = null;
let cachedConfig: Config | null = null;

export async function fetchAllListenings() {
  if (cachedListenings) return cachedListenings;

  const q = query(collection(db, 'listenings'), orderBy('orderIndex', 'asc'));
  const snapshot = await getDocs(q);
  const listenings: Listening[] = [];
  snapshot.forEach(doc => {
    listenings.push({ id: doc.id, ...doc.data() } as Listening);
  });

  cachedListenings = listenings;
  return listenings;
}

export async function fetchConfig() {
  if (cachedConfig) return cachedConfig;

  const docRef = doc(db, 'config', 'startDate');
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    cachedConfig = docSnap.data() as Config;
    return cachedConfig;
  }
  return null;
}

export function useTodayListening(userId: string | undefined) {
  const [listening, setListening] = useState<Listening | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDateStr, setStartDateStr] = useState<string | null>(null);

  // Phase 1: Fetch public listening data immediately (no auth needed)
  useEffect(() => {
    async function loadListening() {
      try {
        const [config, allListenings] = await Promise.all([
          fetchConfig(),
          fetchAllListenings()
        ]);

        if (!config || allListenings.length === 0) {
          setLoading(false);
          return;
        }

        setStartDateStr(config.startDate);

        const index = getDailyListeningIndex(config.startDate, allListenings.length);
        if (index >= 0) {
          setListening(allListenings[index]);
        }
      } catch (err) {
        console.error("Error loading today's listening:", err);
      } finally {
        setLoading(false);
      }
    }
    loadListening();
  }, []); // runs once on mount, no auth dependency

  // Phase 2: Check submission status once user is authenticated
  useEffect(() => {
    if (!userId || !listening) return;
    async function checkSubmission() {
      try {
        const todayStr = formatLocalDateString();
        const q = query(
          collection(db, 'submissions'),
          where('userId', '==', userId),
          where('publishedDate', '==', todayStr)
        );
        const subSnap = await getDocs(q);
        if (!subSnap.empty) {
          setSubmission({ id: subSnap.docs[0].id, ...subSnap.docs[0].data() } as Submission);
        }
      } catch (err) {
        console.error("Error checking submission:", err);
      }
    }
    checkSubmission();
  }, [userId, listening]);

  return { listening, submission, loading, startDateStr };
}

// Hook for previous listenings and pagination
export function usePreviousListenings(userId: string | undefined) {
  const [listenings, setListenings] = useState<{ listening: Listening; publishedDate: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [pageOffset, setPageOffset] = useState(1); // How many days back we've loaded
  const PAGE_SIZE = 5;

  const loadMore = async () => {
    setLoading(true);
    try {
      const [config, allListenings] = await Promise.all([
        fetchConfig(),
        fetchAllListenings()
      ]);

      if (!config || allListenings.length === 0) {
        setLoading(false);
        return;
      }

      const totalListenings = allListenings.length;
      const todayIndex = getDailyListeningIndex(config.startDate, totalListenings);

      if (todayIndex < 0) {
        // Hasn't started yet
        setLoading(false);
        return;
      }

      // We want to load from (pageOffset) to (pageOffset + PAGE_SIZE - 1) days back
      const newItems: { listening: Listening; publishedDate: string }[] = [];
      const localDate = new Date();

      for (let i = 0; i < PAGE_SIZE; i++) {
        const daysBack = pageOffset + i;

        // Calculate the target date local midnight
        const [year, month, day] = config.startDate.split('-').map(Number);
        const startLocal = new Date(year, month - 1, day);

        // Check if daysBack puts us before the start date
        const currentTarget = new Date(localDate);
        currentTarget.setDate(currentTarget.getDate() - daysBack);

        // If currentTarget is before startLocal, we stop
        currentTarget.setHours(0, 0, 0, 0);
        if (currentTarget < startLocal) {
          setHasMore(false);
          break;
        }

        // Calculate index for that day
        // Instead of doing calendar math, just todayIndex - daysBack, wrapped securely
        let pastIndex = (todayIndex - daysBack) % totalListenings;
        if (pastIndex < 0) pastIndex += totalListenings;

        newItems.push({
          listening: allListenings[pastIndex],
          publishedDate: formatLocalDateString(currentTarget)
        });

        if (i === PAGE_SIZE - 1) {
          setHasMore(true);
        }
      }

      setListenings(prev => [...prev, ...newItems]);
      setPageOffset(prev => prev + newItems.length);
    } catch (err) {
      console.error("Error loading previous listenings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { listenings, loading, loadMore, hasMore };
}

// User Streak logic
export function useUserStreak(userId: string | undefined) {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function computeStreak() {
      try {
        const q = query(
          collection(db, 'submissions'),
          where('userId', '==', userId),
          where('submitted', '==', true),
          orderBy('publishedDate', 'desc')
        );

        const snaps = await getDocs(q);
        if (snaps.empty) {
          setStreak(0);
          setLoading(false);
          return;
        }

        // Count consecutive days from today or yesterday
        const todayStr = formatLocalDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = formatLocalDateString(yesterday);

        const submittedDates = new Set(snaps.docs.map(d => d.data().publishedDate));

        let currentStreak = 0;
        let testDate = new Date();
        let testStr = formatLocalDateString(testDate);

        // If today is not submitted, check if yesterday was. If neither, streak is 0.
        if (!submittedDates.has(todayStr)) {
          if (!submittedDates.has(yesterdayStr)) {
            setStreak(0);
            setLoading(false);
            return;
          }
          // The streak continues from yesterday
          testDate = yesterday;
          testStr = yesterdayStr;
        }

        // Count backwards
        while (submittedDates.has(testStr)) {
          currentStreak++;
          testDate.setDate(testDate.getDate() - 1);
          testStr = formatLocalDateString(testDate);
        }

        setStreak(currentStreak);
      } catch (e) {
        console.error("Error computing streak", e);
      } finally {
        setLoading(false);
      }
    }
    computeStreak();
  }, [userId]);

  return { streak, loading };
}
