import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Cherry movies - Stream in Any Format',
  description: 'Stream movies dynamically in any format (.mkv, .mp4, .avi, .avif) with subtitles on Cherry movies.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-red-100 bg-white py-6 text-center text-xs text-slate-400">
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
              <span className="font-bold text-slate-900">
                Cherry <span className="text-red-600">movies</span>
              </span>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}

