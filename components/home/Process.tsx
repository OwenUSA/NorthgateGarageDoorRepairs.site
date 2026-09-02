import { copy } from '@/content/copy';

export function Process() {
  const s = copy.routes['/'].sections.find((sec) => sec.id === 'process')!;
  if (s.id !== 'process') return null;

  return (
    <section
      data-section="process"
      className="bg-(--color-surface) py-16 md:py-24"
    >
      <div className="mx-auto max-w-(--container-max) px-(--container-padding)">
        <h2 className="text-2xl md:text-3xl">{s.heading}</h2>
        <p className="mt-3 max-w-2xl text-base text-(--color-ink-soft)">{s.subheading}</p>

        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {s.steps.map((step) => (
            <li key={step.step}>
              <span
                aria-hidden
                className="flex h-10 w-10 items-center justify-center rounded-(--radius-full) bg-(--color-primary) font-bold text-(--color-on-primary)"
              >
                {step.step}
              </span>
              <p className="mt-4 font-bold text-(--color-ink)">{step.title}</p>
              <p className="mt-2 text-sm text-(--color-ink-soft)">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
