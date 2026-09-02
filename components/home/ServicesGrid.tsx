import Link from 'next/link';
import { copy } from '@/content/copy';
import { business } from '@/lib/business';

export function ServicesGrid() {
  const s = copy.routes['/'].sections.find((sec) => sec.id === 'services-grid')!;
  if (s.id !== 'services-grid') return null;

  return (
    <section
      data-section="services-grid"
      className="overflow-x-hidden overflow-y-auto bg-(--color-surface-muted) pt-[67px] pb-[10px] lg:pt-[140px] lg:pb-[160px]"
    >
      <div className="mx-auto max-w-(--container-max) px-(--container-padding)">
        <h2 className="text-2xl md:text-3xl">{s.heading}</h2>
        <p className="mt-3 max-w-2xl text-base text-(--color-ink-soft)">{s.subheading}</p>

        {/* Below lg (1440) each card carries its own "Learn more" link to /services;
            at lg it drops (the footer CTA row below is the only control) -- matches
            the reference's own band, which likewise exposes far more button-like
            elements at 390/768 than at 1440 (14 vs 2, per the Prompt 1 reference capture). */}
        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {s.items.map((item) => (
            <li
              key={item.label}
              className="rounded-(--radius-lg) bg-(--color-surface) p-6 shadow-(--shadow-sm) transition-transform duration-[180ms] ease-out hover:-translate-y-1 hover:shadow-(--shadow-md) motion-reduce:transition-none"
            >
              <p className="text-sm text-(--color-ink-soft)">{item.symptom}</p>
              <p className="mt-2 text-base font-bold text-(--color-ink)">{item.label}</p>
              <p className="mt-2 text-sm text-(--color-ink-soft)">{item.blurb}</p>
              <Link
                href="/services"
                className="cta-button mt-3 inline-block text-sm font-bold text-(--color-primary) underline lg:hidden"
              >
                Learn more
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/services"
            className="cta-button inline-block font-bold text-(--color-primary) underline"
          >
            {s.ctaLabel}
          </Link>
          <a
            href={`tel:${business.phone.tel}`}
            className="cta-button rounded-(--radius-md) bg-(--color-primary) px-5 py-2 font-bold text-(--color-on-primary)"
          >
            Call now
          </a>
        </div>
      </div>
    </section>
  );
}
