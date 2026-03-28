import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const hostGrotesk = localFont({
  src: '../fonts/host-grotesk/HostGrotesk-VariableFont_wght.ttf',
  variable: '--font-host-grotesk',
  display: 'swap',
});

const seriouslyNostalgic = localFont({
  src: '../fonts/seriously-nostalgic/SeriouslyNostalgicFnIt-Reg.otf',
  variable: '--font-seriously-nostalgic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tenpo UI Kit',
  description: 'Tenpo Design System & Component Library for the Hackathon',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${hostGrotesk.variable} ${seriouslyNostalgic.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
