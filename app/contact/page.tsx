import type { Metadata } from 'next';
import { copy } from '@/content/copy';
import { business } from '@/lib/business';
import { ContactForm } from '@/components/contact/ContactForm';
import { InfoBand } from '@/components/contact/InfoBand';
import { ContactMapSection } from '@/components/contact/ContactMapSection';
import { ReviewsOrCta } from '@/components/contact/ReviewsOrCta';

const meta = copy.routes['/contact'].meta;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: '/contact' },
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: '/contact',
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

export default function ContactPage() {
  return (
    <>
      <ContactForm />
      <InfoBand />
      <ContactMapSection />
      <ReviewsOrCta />
    </>
  );
}
