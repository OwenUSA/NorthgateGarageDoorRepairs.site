'use client';

// Header + desktop nav. Per docs/behavior/sticky-header-transition.md: position static,
// no scroll-triggered state -- the reference has none and we don't invent one.

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, Phone } from 'lucide-react';
import { business } from '@/lib/business';
import { MobileNavDrawer } from './MobileNavDrawer';

export function Header() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  return (
    <header className="relative z-30 border-b border-(--color-border) bg-(--color-surface)">
      <div className="mx-auto flex max-w-(--container-max) items-center justify-between gap-4 px-(--container-padding) py-4">
        <Link href="/" className="font-display text-xl font-black text-(--color-ink)">
          {business.name}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {business.routes.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="text-base font-bold text-(--color-ink-soft) hover:text-(--color-ink)"
            >
              {r.label}
            </Link>
          ))}
        </nav>

        <a
          href={`tel:${business.phone.tel}`}
          className="hidden items-center gap-2 rounded-(--radius-md) bg-(--color-primary) px-4 py-2 font-bold text-(--color-on-primary) transition-transform duration-150 ease-out hover:bg-(--color-primary-strong) active:scale-[0.98] motion-reduce:transition-none md:flex"
        >
          <Phone aria-hidden size={18} />
          {business.phone.display}
        </a>

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav-drawer"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="rounded-md p-2 md:hidden"
        >
          <Menu aria-hidden size={26} />
        </button>
      </div>

      <div id="mobile-nav-drawer">
        <MobileNavDrawer open={open} onClose={() => setOpen(false)} toggleRef={toggleRef} />
      </div>
    </header>
  );
}
