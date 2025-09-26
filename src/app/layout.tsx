
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Alegreya, Belleza } from 'next/font/google';

const belleza = Belleza({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-belleza',
});

const alegreya = Alegreya({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-alegreya',
});


export const metadata: Metadata = {
  title: 'Juvo: Student Well-being Companion',
  description: 'Your safe space to reflect and find support.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className={`${alegreya.variable} ${belleza.variable} font-body antialiased`}>
        <Providers>
          <FirebaseClientProvider>{children}</FirebaseClientProvider>
        </Providers>
      </body>
    </html>
  );
}
