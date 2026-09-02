// Mobile sticky call bar -- docs/behavior/mobile-sticky-call-bar.md. NOVEL, no reference
// counterpart. position:fixed, CSS-media-query gated (not JS width check) so it's present
// in server-rendered HTML before hydration. Hidden at md (768px) and above, where the
// header's own always-visible tel: button covers the same job.

import { Phone } from 'lucide-react';
import { business } from '@/lib/business';

export function MobileCallBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-(--color-border) bg-(--color-surface) md:hidden">
      <a
        href={`tel:${business.phone.tel}`}
        aria-label={`Call ${business.name} now`}
        className="flex items-center justify-center gap-2 bg-(--color-primary) px-4 py-4 text-lg font-bold text-(--color-on-primary) transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none"
      >
        <Phone aria-hidden size={20} />
        Call {business.phone.display}
      </a>
    </div>
  );
}
