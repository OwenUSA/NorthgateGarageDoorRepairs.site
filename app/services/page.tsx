import type { Metadata } from 'next';
import { copy } from '@/content/copy';

export const metadata: Metadata = {
  title: copy.routes['/services'].meta.title,
  description: copy.routes['/services'].meta.description,
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-(--container-max) px-(--container-padding) py-24">
      <h1 className="text-3xl">Services -- shell stub</h1>
    </div>
  );
}
