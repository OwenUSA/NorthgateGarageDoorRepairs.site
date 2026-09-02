'use client';

// <BusinessMap> -- D-07/D-08, docs/behavior/map-lazy-mount.md.
// Coords-only, keyless embed. Exactly one per page -- never the reference's five-iframe
// grid pattern (docs/sections.md notes that pattern on /contact-us/, deleted per D-02).
// Double-lazy: native loading="lazy" plus an IntersectionObserver gating the iframe's
// src assignment, aspect-ratio wrapper reserves space before mount (zero layout shift).

import { useEffect, useRef, useState } from 'react';
import { business } from '@/lib/business';

export function BusinessMap({
  zoom,
  title,
  aspect = '16/9',
}: {
  zoom: number;
  title: string;
  aspect?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <div
        ref={wrapperRef}
        className="overflow-hidden rounded-(--radius-lg) bg-(--color-surface-muted)"
        style={{ aspectRatio: aspect }}
      >
        {shouldMount ? (
          <iframe
            src={business.mapEmbedSrc(zoom)}
            title={title}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-(--color-ink-soft)">
            Map loading…
          </div>
        )}
      </div>
      <a
        href={business.directionsUrl}
        className="mt-3 inline-block text-sm font-bold text-(--color-primary) underline"
      >
        Get directions
      </a>
    </div>
  );
}
