import { copy } from '@/content/copy';

export function Testimonials() {
  const s = copy.routes['/'].sections.find((sec) => sec.id === 'testimonials')!;
  if (s.id !== 'testimonials') return null;

  return (
    <section
      data-section="testimonials"
      className="bg-(--color-surface) pt-[60px] pb-[70px] lg:pt-[160px] lg:pb-[320px]"
    >
      <div className="mx-auto max-w-(--container-max) px-(--container-padding)">
        <h2 className="text-2xl md:text-3xl">{s.heading}</h2>
        <p className="mt-3 max-w-2xl text-base text-(--color-ink-soft)">{s.subheading}</p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {s.placeholders.map((p, i) => (
            <blockquote
              key={i}
              className="rounded-(--radius-lg) border border-(--color-border) p-6 text-sm italic text-(--color-ink-soft)"
            >
              {p}
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
