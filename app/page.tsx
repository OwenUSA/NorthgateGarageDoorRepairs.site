import type { Metadata } from 'next';
import { copy } from '@/content/copy';

export const metadata: Metadata = {
  title: copy.routes['/'].meta.title,
  description: copy.routes['/'].meta.description,
};

// Shell-only stub -- Prompt 5, item 8. Real sections land in Prompt 6.
export default function HomePage() {
  return (
    <div className="mx-auto max-w-(--container-max) px-(--container-padding) py-24">
      <h1 className="text-3xl">Home -- shell stub</h1>
    </div>
  );
}
