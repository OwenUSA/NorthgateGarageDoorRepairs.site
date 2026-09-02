'use client';

// One symptom-first card. Below 768px it's an accordion trigger (grid-template-rows
// 0fr/1fr technique, only one open at a time) per docs/behavior/service-accordion.md;
// at 768px+ the blurb is always open and the trigger button doesn't render at all.

import { Phone } from 'lucide-react';
import Link from 'next/link';
import { business } from '@/lib/business';
import type { ServiceItem } from '@/content/copy';

export function ServiceCard({
  item,
  open,
  onToggle,
}: {
  item: ServiceItem;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `service-panel-${item.id}`;

  return (
    <li className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-6">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left md:pointer-events-none"
      >
        <span>
          <span className="block text-sm text-(--color-ink-soft)">{item.symptom}</span>
          <span className="mt-1 block text-lg font-bold text-(--color-ink)">{item.label}</span>
        </span>
        <span
          aria-hidden
          className={`shrink-0 text-(--color-primary) transition-transform duration-[250ms] ease-in-out motion-reduce:duration-[10ms] md:hidden ${
            open ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={panelId}
        className={`grid transition-[grid-template-rows] duration-[250ms] ease-in-out motion-reduce:duration-[10ms] md:grid-rows-[1fr]! ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="mt-3 text-sm text-(--color-ink-soft)">{item.blurb}</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <a
              href={`tel:${business.phone.tel}`}
              className="cta-button flex items-center gap-2 rounded-(--radius-md) bg-(--color-primary) px-4 py-2 text-sm font-bold text-(--color-on-primary)"
            >
              <Phone aria-hidden size={16} />
              {business.phone.display}
            </a>
            <Link
              href="/contact"
              className="cta-button rounded-(--radius-md) border border-(--color-border) px-4 py-2 text-sm font-bold text-(--color-ink)"
            >
              Request a callback
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}
