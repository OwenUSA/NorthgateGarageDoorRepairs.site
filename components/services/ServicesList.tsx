'use client';

import { useState } from 'react';
import { copy } from '@/content/copy';
import { ServiceCard } from './ServiceCard';

export function ServicesList() {
  const s = copy.routes['/services'].sections.find((sec) => sec.id === 'services-list')!;
  const [openId, setOpenId] = useState<string | null>(null);
  if (s.id !== 'services-list') return null;

  return (
    <section
      data-section="services-list"
      className="bg-(--color-surface-muted) pt-[115px] pb-[35px] md:pt-[160px] md:pb-[60px] lg:pt-[305px] lg:pb-[125px]"
    >
      <div className="mx-auto max-w-(--container-max) px-(--container-padding)">
        <h2 className="text-2xl md:text-3xl">{s.heading}</h2>

        <ul className="mt-8 flex flex-col gap-4">
          {s.items.map((item) => (
            <ServiceCard
              key={item.id}
              item={item}
              open={openId === item.id}
              onToggle={() => setOpenId((cur) => (cur === item.id ? null : item.id))}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
