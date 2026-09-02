import type { Metadata } from 'next';
import { copy } from '@/content/copy';
import { ContactForm } from '@/components/contact/ContactForm';
import { InfoBand } from '@/components/contact/InfoBand';
import { ContactMapSection } from '@/components/contact/ContactMapSection';
import { ReviewsOrCta } from '@/components/contact/ReviewsOrCta';

export const metadata: Metadata = {
  title: copy.routes['/contact'].meta.title,
  description: copy.routes['/contact'].meta.description,
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
