import type { Metadata } from 'next';
import { copy } from '@/content/copy';
import { SymptomPrompt } from '@/components/services/SymptomPrompt';
import { ServicesList } from '@/components/services/ServicesList';

export const metadata: Metadata = {
  title: copy.routes['/services'].meta.title,
  description: copy.routes['/services'].meta.description,
};

export default function ServicesPage() {
  return (
    <>
      <SymptomPrompt />
      <ServicesList />
    </>
  );
}
