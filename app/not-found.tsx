// Custom 404 -- renders inside RootLayout (app/layout.tsx), so it automatically gets the
// Header/Footer/MobileCallBar shell, skip link, and JSON-LD like every other route. Only
// the five routes in CLAUDE.md's ROUTES constant are linked out (D-01) -- no locations
// page, no per-service routes.
import Link from 'next/link';
import { business } from '@/lib/business';

export default function NotFound() {
  return (
    <section className="mx-auto max-w-(--container-max) px-(--container-padding) py-24 text-center">
      <p className="font-display text-2xl font-black text-(--color-ink)">404</p>
      <h1 className="mt-2 text-xl font-bold text-(--color-ink)">Page not found</h1>
      <p className="mx-auto mt-4 max-w-prose text-base text-(--color-ink-soft)">
        That page doesn&apos;t exist. Try the home page, or call{' '}
        <a href={`tel:${business.phone.tel}`} className="font-bold text-(--color-primary)">
          {business.phone.display}
        </a>{' '}
        and we&apos;ll point you in the right direction.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-(--radius-md) bg-(--color-primary) px-6 py-3 font-bold text-(--color-on-primary) transition-transform duration-150 ease-out hover:bg-(--color-primary-strong) active:scale-[0.98] motion-reduce:transition-none"
      >
        Back to home
      </Link>
    </section>
  );
}
