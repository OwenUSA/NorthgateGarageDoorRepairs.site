import type { Metadata } from 'next';
import { copy } from '@/content/copy';
import { business } from '@/lib/business';
import { AboutIntro } from '@/components/about/AboutIntro';

const meta = copy.routes['/about'].meta;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: '/about' },
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: '/about',
    siteName: business.name,
    type: 'website',
    images: [{ url: '/placeholders/bg-hero-bg-desktop.svg', width: 1440, height: 891, alt: business.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: meta.title,
    description: meta.description,
    images: ['/placeholders/bg-hero-bg-desktop.svg'],
  },
};

export default function AboutPage() {
  return <AboutIntro />;
}
