// /about's only section -- ADAPTED, ref s01. See docs/sections.md: the reference
// segments as header+footer chrome only under our sectionCandidates, so there is no
// reliable per-section length target here (docs/content-divergence.md marks it exempt).
// No invented history/founding year/headcount/certifications (D-14/D-17) -- the
// TODO(fact) lines from content/copy.ts render as visible placeholder chips, not
// invented text.

import { copy } from '@/content/copy';

export function AboutIntro() {
  const s = copy.routes['/about'].sections.find((sec) => sec.id === 'intro-body')!;

  return (
    <section
      data-section="intro-body"
      className="bg-(--color-surface) pt-[115px] pb-[35px] md:pt-[160px] md:pb-[60px] lg:pt-[305px] lg:pb-[125px]"
    >
      <div className="mx-auto max-w-(--container-max) px-(--container-padding)">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-start">
          <div>
            <h1 className="text-3xl md:text-4xl">{s.heading}</h1>
            <div className="mt-6 flex max-w-2xl flex-col gap-4">
              {s.body.map((para, i) => (
                <p key={i} className="text-base text-(--color-ink-soft)">
                  {para}
                </p>
              ))}
            </div>

            <ul className="mt-8 flex flex-col gap-2">
              {s.factNotes.map((note) => (
                <li
                  key={note}
                  className="w-fit rounded-(--radius-sm) border border-dashed border-(--color-border) px-3 py-1.5 text-sm text-(--color-ink-soft)"
                >
                  {note}
                </li>
              ))}
            </ul>
          </div>

          {/* Photo placeholder -- no INVENTORY slot exists for this page specifically
              (the reference's real body content wasn't isolated by the harness, see
              docs/sections.md), so this is a generic aspect-ratio box, not a lifted
              reference photo (D-09). Real photo commissioned in Prompt 10. */}
          <div
            className="flex aspect-[4/5] items-center justify-center rounded-(--radius-lg) bg-(--color-surface-muted) text-sm text-(--color-ink-soft)"
            role="img"
            aria-label="Team photo placeholder"
          >
            team-photo placeholder
          </div>
        </div>
      </div>
    </section>
  );
}
