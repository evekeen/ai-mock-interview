import NavBar from '@/components/NavBar';
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Behavioral Interview Coach',
  description: 'AI-powered behavioral interview preparation assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen flex flex-col bg-gray-50">
            <NavBar />
            <main className="flex-grow">{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
