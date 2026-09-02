import type { Metadata } from 'next';
import { Figtree, Russo_One } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileCallBar } from '@/components/MobileCallBar';
import { business } from '@/lib/business';
import { localBusinessJsonLd } from '@/lib/jsonld';

// Prompt 2 confirmed both are open, standard Google Fonts -- no D-11 substitution.
const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-figtree',
  display: 'swap',
});

const russoOne = Russo_One({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-russo-one',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(business.siteUrl),
  title: {
    default: business.name,
    template: `%s | ${business.name}`,
  },
  description: business.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = localBusinessJsonLd();
  return (
    <html lang="en" className={`${figtree.variable} ${russoOne.variable}`}>
      <body className="flex min-h-screen flex-col pb-20 md:pb-0">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger -- static JSON-LD, no user input
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-(--color-primary) focus:px-4 focus:py-2 focus:text-(--color-on-primary)"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <MobileCallBar />
      </body>
    </html>
  );
}
