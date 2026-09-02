import { Phone } from 'lucide-react';
import { copy } from '@/content/copy';
import { business } from '@/lib/business';

export function ReviewsOrCta() {
  const s = copy.routes['/contact'].sections.find((sec) => sec.id === 'reviews-or-cta')!;
  if (s.id !== 'reviews-or-cta') return null;

  return (
    <section
      data-section="reviews-or-cta"
      className="bg-(--color-surface-muted) pt-[115px] pb-[35px] md:pt-[160px] md:pb-[60px] lg:pt-[305px] lg:pb-[125px]"
    >
      <div className="mx-auto max-w-(--container-max) px-(--container-padding)">
        <h2 className="text-2xl md:text-3xl">{s.heading}</h2>
        <p className="mt-3 max-w-xl text-base text-(--color-ink-soft)">{s.body}</p>
        <div className="mt-6 flex flex-wrap gap-4">
          <a
            href={`tel:${business.phone.tel}`}
            className="cta-button inline-flex items-center gap-2 rounded-(--radius-md) bg-(--color-primary) px-6 py-3 font-bold text-(--color-on-primary) transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none"
          >
            <Phone aria-hidden size={18} />
            {s.ctaLabel}
          </a>
          <a
            href="#contact-form"
            className="cta-button inline-flex items-center rounded-(--radius-md) border border-(--color-border) px-6 py-3 font-bold text-(--color-ink)"
          >
            Fill out the form instead
          </a>
        </div>
      </div>
    </section>
  );
}
