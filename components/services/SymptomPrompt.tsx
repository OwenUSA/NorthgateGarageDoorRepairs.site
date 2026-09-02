import { copy } from '@/content/copy';

export function SymptomPrompt() {
  const s = copy.routes['/services'].sections.find((sec) => sec.id === 'symptom-prompt')!;
  if (s.id !== 'symptom-prompt') return null;

  return (
    <section
      data-section="symptom-prompt"
      className="bg-(--color-surface) py-0"
    >
      <div className="mx-auto max-w-(--container-max) px-(--container-padding) pt-12 pb-6 md:pt-16">
        <h1 className="text-3xl md:text-4xl">{s.heading}</h1>
        <p className="mt-4 max-w-2xl text-base text-(--color-ink-soft)">{s.body}</p>
      </div>
    </section>
  );
}
