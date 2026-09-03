import type { Metadata } from 'next';
import { copy } from '@/content/copy';
import { business } from '@/lib/business';
import { Hero } from '@/components/home/Hero';
import { ServicesGrid } from '@/components/home/ServicesGrid';
import { Testimonials } from '@/components/home/Testimonials';
import { Intro } from '@/components/home/Intro';
import { Process } from '@/components/home/Process';
import { HomeMapSection } from '@/components/home/HomeMapSection';

const meta = copy.routes['/'].meta;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: '/' },
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: '/',
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

// Built top to bottom per docs/sections.md's reordering (structural change #1):
// Hero -> ServicesGrid -> Testimonials -> Intro -> Process -> Map.
export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesGrid />
      <Testimonials />
      <Intro />
      <Process />
      <HomeMapSection />
    </>
  );
}
