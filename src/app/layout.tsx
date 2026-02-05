
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/app/context/AuthContext';
import { SettingsProvider } from '@/app/context/SettingsContext';

export const metadata: Metadata = {
  title: 'Task Compass',
  description: 'Navigate your productivity with precision',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background">
        <AuthProvider>
          <SettingsProvider>
            {children}
            <Toaster />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
