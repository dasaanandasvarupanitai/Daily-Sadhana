import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Daily Sadhana - Bhakti Sastri',
  description: 'Daily listening portal for the Bhakti Sastri batch.',
  icons: {
    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/A.C._Bhaktivedanta_Swami_Prabhupada_1972.jpg/151px-A.C._Bhaktivedanta_Swami_Prabhupada_1972.jpg'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#faf8f5] text-gray-900 min-h-screen selection:bg-orange-200`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
