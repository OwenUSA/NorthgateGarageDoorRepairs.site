import { Phone } from 'lucide-react';
import { copy } from '@/content/copy';
import { business } from '@/lib/business';

export function InfoBand() {
  const s = copy.routes['/contact'].sections.find((sec) => sec.id === 'info-band')!;
  if (s.id !== 'info-band') return null;

  return (
    <section data-section="info-band" className="bg-(--color-surface-muted) py-0">
      <div className="mx-auto max-w-(--container-max) px-(--container-padding) py-10">
        <h2 className="text-2xl">{s.heading}</h2>
        <div className="mt-4 flex flex-wrap gap-8">
          <a
            href={`tel:${business.phone.tel}`}
            className="cta-button flex items-center gap-2 font-bold text-(--color-primary)"
          >
            <Phone aria-hidden size={18} />
            {s.phoneLabel}
          </a>
          <p className="text-base text-(--color-ink-soft)">{s.hoursLabel}</p>
          <address className="not-italic text-base text-(--color-ink-soft)">
            {business.address.full}
          </address>
        </div>
      </div>
    </section>
  );
}
