'use client';

// Mobile nav drawer -- implements docs/behavior/mobile-nav-drawer.md exactly:
// transform + opacity only, body scroll lock via position:fixed, closes on
// Escape/backdrop/pathname change, focus trapped while open, restored on close.

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { business } from '@/lib/business';

export function MobileNavDrawer({
  open,
  onClose,
  toggleRef,
}: {
  open: boolean;
  onClose: () => void;
  toggleRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const scrollYRef = useRef(0);

  // Close on pathname change -- App Router does not do this automatically; a <Link>
  // click updates the route but leaves this component's own `open` state untouched.
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire only on route change
  }, [pathname]);

  // Body scroll lock: position:fixed + top offset, NOT overflow:hidden (iOS Safari
  // ignores overflow:hidden on <body>).
  useEffect(() => {
    if (open) {
      scrollYRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, scrollYRef.current);
    }
  }, [open]);

  // Escape to close, focus trap while open, restore focus to the toggle on close.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    );
    focusables?.[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      toggleRef.current?.focus();
    };
  }, [open, onClose, toggleRef]);

  const links = [...business.routes];

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-(--color-ink-strong)/60 transition-opacity duration-200 ease-linear motion-reduce:duration-[10ms] ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        inert={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(320px,85vw)] flex-col bg-(--color-surface) p-6 shadow-(--shadow-md) transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-[10ms] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="ml-auto rounded-md p-2"
        >
          <X aria-hidden size={24} />
        </button>
        <nav aria-label="Primary">
          <ul className="flex flex-col gap-1">
            {links.map((link, i) => (
              <li
                key={link.href}
                className={`transition-all duration-200 ease-out motion-reduce:duration-[10ms] motion-reduce:transition-none ${
                  open ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0'
                }`}
                style={{ transitionDelay: open ? `${80 + i * 30}ms` : '0ms' }}
              >
                <Link
                  href={link.href}
                  className="block rounded-md px-3 py-3 text-lg font-bold text-(--color-ink)"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href={`tel:${business.phone.tel}`}
          className="mt-6 rounded-(--radius-md) bg-(--color-primary) px-4 py-3 text-center font-bold text-(--color-on-primary)"
        >
          Call {business.phone.display}
        </a>
      </div>
    </>
  );
}
