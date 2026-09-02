import type { Metadata } from 'next';
import { copy } from '@/content/copy';

export const metadata: Metadata = {
  title: copy.routes['/contact'].meta.title,
  description: copy.routes['/contact'].meta.description,
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-(--container-max) px-(--container-padding) py-24">
      <h1 className="text-3xl">Contact -- shell stub</h1>
    </div>
  );
}
