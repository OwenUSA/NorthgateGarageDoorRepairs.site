// NOVEL, no reference counterpart -- measured by token conformance only (D-16).
// Contact section lists phone + postal address only, no email intake. No GDPR/CCPA
// compliance claims. The UNREVIEWED notice is rendered visibly, not just as a code
// comment, so it survives into the shipped page until legal review happens (Prompt 11).

import { copy } from '@/content/copy';
import { business } from '@/lib/business';

export function PolicyBody() {
  const s = copy.routes['/privacy'].sections.find((sec) => sec.id === 'policy-body')!;

  return (
    <section data-section="policy-body" className="bg-(--color-surface) py-16 md:py-24">
      <div className="mx-auto max-w-(--container-max) px-(--container-padding)">
        {/* UNREVIEWED TEMPLATE — requires legal review before launch */}
        <p className="w-fit rounded-(--radius-sm) border border-dashed border-(--color-error) px-3 py-1.5 text-sm font-bold text-(--color-error)">
          {s.notice}
        </p>

        <h1 className="mt-6 text-3xl md:text-4xl">{s.heading}</h1>

        <div className="mt-8 flex max-w-2xl flex-col gap-8">
          {s.body.map((block) => (
            <div key={block.heading}>
              <h2 className="text-xl">{block.heading}</h2>
              <div className="mt-3 flex flex-col gap-3">
                {block.heading === 'How to reach us about this policy' ? (
                  // Rendered from lib/business.ts, not the literal copy string --
                  // Prompt 5's single-source-of-truth rule for phone/address.
                  <p className="text-base text-(--color-ink-soft)">
                    Questions about this policy can be directed to {business.phone.display} or
                    by mail to {business.address.full}. We do not accept privacy inquiries by
                    email because we do not operate an email intake for this site.
                  </p>
                ) : (
                  block.paragraphs.map((p, i) => (
                    <p key={i} className="text-base text-(--color-ink-soft)">
                      {p}
                    </p>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
