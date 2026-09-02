import type { Metadata } from 'next';
import { copy } from '@/content/copy';
import { AboutIntro } from '@/components/about/AboutIntro';

export const metadata: Metadata = {
  title: copy.routes['/about'].meta.title,
  description: copy.routes['/about'].meta.description,
};

export default function AboutPage() {
  return <AboutIntro />;
}
