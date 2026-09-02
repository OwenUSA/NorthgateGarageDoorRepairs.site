import type { Metadata } from 'next';
import { copy } from '@/content/copy';

export const metadata: Metadata = {
  title: copy.routes['/privacy'].meta.title,
  description: copy.routes['/privacy'].meta.description,
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-(--container-max) px-(--container-padding) py-24">
      <h1 className="text-3xl">Privacy -- shell stub</h1>
    </div>
  );
}
