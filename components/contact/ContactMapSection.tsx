// D-07/D-08: exactly ONE coords-only embed here, zoom ~15 -- never the reference's
// five-iframe locations grid (docs/sections.md, this same route, ref s03).

import { copy } from '@/content/copy';
import { BusinessMap } from '@/components/BusinessMap';

export function ContactMapSection() {
  const s = copy.routes['/contact'].sections.find((sec) => sec.id === 'map')!;
  if (s.id !== 'map') return null;

  return (
    <section data-section="map" className="bg-(--color-surface) py-0">
      <div className="mx-auto max-w-(--container-max) px-(--container-padding) py-10">
        <h2 className="text-2xl">{s.heading}</h2>
        <p className="mt-2 text-base text-(--color-ink-soft)">{s.caption}</p>
        <div className="mt-6 max-w-2xl">
          <BusinessMap zoom={15} title="Map to Northgate Garage Door Repairs" aspect="4/3" />
        </div>
      </div>
    </section>
  );
}
