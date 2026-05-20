import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AuthProvider } from '@/components/layout/AuthProvider';
import { Toaster } from '@/components/ui/sonner';

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: 'ZeroSbatti Social Client Hub',
  description: 'Piattaforma centralizzata per la gestione clienti, contenuti e campagne - ZeroSbatti Social',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-white`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
