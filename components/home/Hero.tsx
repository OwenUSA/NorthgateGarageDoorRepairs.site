// Hero -- lead-owned per Prompt 6 (touches shared components: header phone CTA, tokens).
// ADAPTED vs reference s01. Content from content/copy.ts.

import { Phone } from 'lucide-react';
import { copy } from '@/content/copy';
import { business } from '@/lib/business';

export function Hero() {
  const s = copy.routes['/'].sections.find((sec) => sec.id === 'hero')!;
  if (s.id !== 'hero') return null;

  return (
    <section
      data-section="hero"
      className="overflow-hidden bg-(--color-surface) pt-[65px] pb-[100px] lg:pt-[185px] lg:pb-[225px]"
    >
      <div className="mx-auto max-w-(--container-max) px-(--container-padding)">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl">{s.heading}</h1>
          <p className="mt-4 text-lg font-bold text-(--color-ink)">{s.subheading}</p>
          <p className="mt-4 max-w-2xl text-base text-(--color-ink-soft)">{s.body}</p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={`tel:${business.phone.tel}`}
              className="flex items-center gap-2 rounded-(--radius-md) bg-(--color-primary) px-6 py-3 font-bold text-(--color-on-primary) transition-transform duration-150 ease-out hover:bg-(--color-primary-strong) active:scale-[0.98] motion-reduce:transition-none"
            >
              <Phone aria-hidden size={18} />
              {s.primaryCtaLabel}
            </a>
            <a
              href="/contact"
              className="cta-button rounded-(--radius-md) border border-(--color-border) px-6 py-3 font-bold text-(--color-ink)"
            >
              {s.secondaryCtaLabel}
            </a>
          </div>

          <p className="mt-6 text-sm text-(--color-ink-soft)">{s.trustLine}</p>
        </div>
      </div>
    </section>
  );
}
