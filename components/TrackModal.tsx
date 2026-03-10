"use client";

import React, { useEffect, useState } from 'react';
import { X, Trophy, Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useUserStreak, formatLocalDateString } from '@/lib/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TrackModalProps {
  onClose: () => void;
}

export function TrackModal({ onClose }: TrackModalProps) {
  const { user } = useAuth();
  const { streak } = useUserStreak(user?.uid);
  const [data, setData] = useState<{ name: string; date: string; submissions: number; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLast14Days() {
      if (!user) return;
      try {
        const today = new Date();
        const datesArray = [];
        
        // Let's generate the last 14 days
        for (let i = 13; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          datesArray.push(formatLocalDateString(d));
        }

        const startDateStr = datesArray[0];

        // Fetch submissions from the last 14 days
        const q = query(
          collection(db, 'submissions'),
          where('userId', '==', user.uid),
          where('publishedDate', '>=', startDateStr)
        );

        const snaps = await getDocs(q);
        const submittedSet = new Set(snaps.docs.filter(d => d.data().submitted).map(d => d.data().publishedDate));

        const chartData = datesArray.map(dateStr => {
          const match = dateStr.match(/^\d{4}-(\d{2})-(\d{2})$/);
          let label = dateStr;
          if (match) {
            label = `${match[1]}/${match[2]}`; // MM/DD
          }
          const isSubmitted = submittedSet.has(dateStr);
          return {
            name: label,
            date: dateStr,
            submissions: isSubmitted ? 1 : 0,
            status: isSubmitted ? 'Submitted' : 'Missed'
          };
        });

        setData(chartData);
      } catch (err) {
        console.error("Failed to load chart data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLast14Days();
  }, [user]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity duration-300">
      <div 
        className="bg-white rounded-3xl w-full max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Activity className="text-orange-500" />
              Sadhana Tracking
            </h2>
            <p className="text-gray-500 text-sm mt-1">Your consistency over the last 14 days</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-6 bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-100 mb-8 shadow-sm">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
            <Trophy className="text-yellow-500" size={32} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-widest">Current Streak</p>
            <div className="flex items-end gap-2 text-orange-600 mt-1">
              <span className="text-4xl font-black leading-none">{streak}</span>
              <span className="text-lg font-bold mb-1 border-b-2 border-orange-200">Days</span>
            </div>
            {streak === 0 ? (
              <p className="text-xs text-orange-800 mt-1 flex items-center gap-1">
                <AlertCircle size={12}/> Start today to build a streak!
              </p>
            ) : (
              <p className="text-xs text-orange-800 mt-1">Keep it up! No skips allowed.</p>
            )}
          </div>
        </div>

        <h3 className="font-semibold text-gray-800 mb-4 px-2">Last 14 Days</h3>
        
        {loading ? (
          <div className="h-48 flex items-center justify-center text-gray-400">Loading chart...</div>
        ) : (
          <div className="h-48 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  interval={1}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(251, 146, 60, 0.1)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const isComplete = d.submissions > 0;
                      return (
                        <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
                          <p className="font-bold text-gray-300">{new Date(d.date).toLocaleDateString()}</p>
                          <p className={`font-semibold mt-1 ${isComplete ? 'text-green-400' : 'text-red-400'}`}>
                            {d.status}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="submissions" 
                  fill="#f97316" 
                  radius={[4, 4, 4, 4]} 
                  barSize={12}
                  activeBar={{ fill: '#ea580c' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
