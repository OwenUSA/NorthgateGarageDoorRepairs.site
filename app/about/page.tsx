import type { Metadata } from 'next';
import { copy } from '@/content/copy';

export const metadata: Metadata = {
  title: copy.routes['/about'].meta.title,
  description: copy.routes['/about'].meta.description,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-(--container-max) px-(--container-padding) py-24">
      <h1 className="text-3xl">About -- shell stub</h1>
    </div>
  );
}
