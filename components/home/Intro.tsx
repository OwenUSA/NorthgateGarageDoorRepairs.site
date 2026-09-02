import { copy } from '@/content/copy';

export function Intro() {
  const s = copy.routes['/'].sections.find((sec) => sec.id === 'intro')!;
  if (s.id !== 'intro') return null;

  return (
    <section
      data-section="intro"
      className="bg-(--color-surface-muted) pt-[6px] pb-0 lg:pt-[13px] lg:pb-[30px]"
    >
      <div className="mx-auto max-w-(--container-max) px-(--container-padding)">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl">{s.heading}</h2>
          <p className="mt-4 text-base text-(--color-ink-soft)">{s.body}</p>
        </div>
      </div>
    </section>
  );
}
