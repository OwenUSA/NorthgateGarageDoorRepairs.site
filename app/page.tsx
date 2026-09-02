import type { Metadata } from 'next';
import { copy } from '@/content/copy';
import { Hero } from '@/components/home/Hero';
import { ServicesGrid } from '@/components/home/ServicesGrid';
import { Testimonials } from '@/components/home/Testimonials';
import { Intro } from '@/components/home/Intro';
import { Process } from '@/components/home/Process';
import { HomeMapSection } from '@/components/home/HomeMapSection';

export const metadata: Metadata = {
  title: copy.routes['/'].meta.title,
  description: copy.routes['/'].meta.description,
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
