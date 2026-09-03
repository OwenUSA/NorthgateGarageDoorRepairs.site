import type { Metadata } from 'next';
import { copy } from '@/content/copy';
import { business } from '@/lib/business';
import { SymptomPrompt } from '@/components/services/SymptomPrompt';
import { ServicesList } from '@/components/services/ServicesList';

const meta = copy.routes['/services'].meta;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: '/services' },
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: '/services',
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

export default function ServicesPage() {
  return (
    <>
      <SymptomPrompt />
      <ServicesList />
    </>
  );
}
