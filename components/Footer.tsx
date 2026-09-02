// Footer -- NAP block, hours, SERVICE_AREA sentence, route links, no email column
// (D-03), no Locations link (D-02). Shared shell, owned by the lead per CLAUDE.md.

import Link from 'next/link';
import { business } from '@/lib/business';

export function Footer() {
  return (
    <footer
      data-section="footer"
      className="border-t border-(--color-border) bg-(--color-ink-strong) text-(--color-surface)"
    >
      <div className="mx-auto max-w-(--container-max) px-(--container-padding) py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-display text-lg font-black">{business.name}</p>
            <p className="mt-2 text-sm text-(--color-surface)/80">{business.tagline}</p>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-(--tracking-wide) text-(--color-surface)/60">
              Contact
            </p>
            <a href={`tel:${business.phone.tel}`} className="mt-2 block font-bold">
              {business.phone.display}
            </a>
            <address className="mt-1 not-italic text-sm text-(--color-surface)/80">
              {business.address.full}
            </address>
            <p className="mt-2 text-sm text-(--color-surface)/80">{business.hours.display}</p>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-(--tracking-wide) text-(--color-surface)/60">
              Pages
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {[...business.routes, ...business.footerOnlyRoutes].map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="text-sm text-(--color-surface)/80 hover:text-(--color-surface)">
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-8 border-t border-(--color-surface)/10 pt-6 text-sm text-(--color-surface)/60">
          {business.serviceArea}
        </p>
      </div>
    </footer>
  );
}
