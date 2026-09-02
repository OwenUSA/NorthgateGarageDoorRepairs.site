// Map section -- lead-owned (Prompt 6: "Build the hero and the map section yourself --
// they touch shared components"). D-08: one section on the home page, zoom ~13.

import { copy } from '@/content/copy';
import { BusinessMap } from '@/components/BusinessMap';

export function HomeMapSection() {
  const s = copy.routes['/'].sections.find((sec) => sec.id === 'map')!;
  if (s.id !== 'map') return null;

  return (
    <section
      data-section="map"
      className="bg-(--color-surface-muted) py-16 md:py-24"
    >
      <div className="mx-auto max-w-(--container-max) px-(--container-padding)">
        <h2 className="text-2xl md:text-3xl">{s.heading}</h2>
        <p className="mt-3 text-base text-(--color-ink-soft)">{s.caption}</p>
        <div className="mt-8 max-w-3xl">
          <BusinessMap zoom={13} title="Map showing Northgate Garage Door Repairs' service area" />
        </div>
      </div>
    </section>
  );
}
