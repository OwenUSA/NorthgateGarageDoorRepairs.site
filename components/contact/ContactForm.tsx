'use client';

// STUB: no submission target. Plain React state, no react-hook-form/zod (banned by the
// dependency allowlist for a five-field form with no backend, see process.md Appendix A).
// Behavior per docs/behavior/form-field-states.md: validate onBlur (and onChange only
// once a field already has an active error), aria-live error summary, phone formatted
// on blur. D-05: no email field, ten-line validator, "we'll call you back" success state.

import { useState } from 'react';
import { copy } from '@/content/copy';

type FieldName = 'name' | 'phone' | 'service' | 'window' | 'message';
type Values = Record<FieldName, string>;
type Errors = Partial<Record<FieldName, string>>;

const EMPTY: Values = { name: '', phone: '', service: '', window: '', message: '' };

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'Enter your name.';
  const phoneDigits = values.phone.replace(/\D/g, '');
  if (phoneDigits.length !== 10) errors.phone = 'Enter a 10-digit phone number.';
  if (!values.service) errors.service = 'Pick what the door needs.';
  if (!values.window) errors.window = 'Pick a callback window.';
  return errors;
}

export function ContactForm() {
  const s = copy.routes['/contact'].sections.find((sec) => sec.id === 'contact-form')!;
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  if (s.id !== 'contact-form') return null;

  function setField(name: FieldName, value: string) {
    const next = { ...values, [name]: value };
    setValues(next);
    // Re-validate live only once a field already carries an error, so it can clear as
    // soon as it becomes valid without waiting for another blur.
    if (errors[name]) setErrors(validate(next));
  }

  function onBlur(name: FieldName) {
    setErrors((prev) => ({ ...prev, ...validate(values) }));
    if (name === 'phone') setValues((prev) => ({ ...prev, phone: formatPhone(prev.phone) }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    // STUB: no submission target -- see file header.
    console.warn('STUB contact form submit -- no backend wired up', values);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <section
        data-section="contact-form"
        className="bg-(--color-surface) py-0"
      >
        <div className="mx-auto max-w-(--container-max) px-(--container-padding) py-16 md:py-24">
          <div
            role="status"
            className="max-w-xl rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface-muted) p-6"
          >
            <p className="text-lg font-bold text-(--color-ink)">{s.submittedMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  const errorCount = Object.keys(errors).length;

  return (
    <section id="contact-form" data-section="contact-form" className="bg-(--color-surface) py-0">
      <div className="mx-auto max-w-(--container-max) px-(--container-padding) py-16 md:py-24">
        <h1 className="text-3xl md:text-4xl">{s.heading}</h1>
        <p className="mt-3 max-w-xl text-base text-(--color-ink-soft)">{s.body}</p>

        <form
          noValidate
          onSubmit={onSubmit}
          className="mt-8 flex max-w-xl flex-col gap-5"
        >
          <div aria-live="polite" className="sr-only">
            {errorCount > 0 ? `${errorCount} field${errorCount === 1 ? '' : 's'} need attention` : ''}
          </div>

          <Field label="Full name" error={errors.name}>
            <input
              type="text"
              name="name"
              value={values.name}
              onChange={(e) => setField('name', e.target.value)}
              onBlur={() => onBlur('name')}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'err-name' : undefined}
              className={inputClass(!!errors.name)}
            />
          </Field>

          <Field label="Phone number" error={errors.phone}>
            <input
              type="tel"
              name="phone"
              value={values.phone}
              onChange={(e) => setField('phone', e.target.value)}
              onBlur={() => onBlur('phone')}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'err-phone' : undefined}
              className={inputClass(!!errors.phone)}
            />
          </Field>

          <Field label="What's wrong?" error={errors.service}>
            <select
              name="service"
              value={values.service}
              onChange={(e) => setField('service', e.target.value)}
              onBlur={() => onBlur('service')}
              aria-invalid={!!errors.service}
              aria-describedby={errors.service ? 'err-service' : undefined}
              className={inputClass(!!errors.service)}
            >
              <option value="">Select one</option>
              {s.serviceOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Best callback time" error={errors.window}>
            <select
              name="window"
              value={values.window}
              onChange={(e) => setField('window', e.target.value)}
              onBlur={() => onBlur('window')}
              aria-invalid={!!errors.window}
              aria-describedby={errors.window ? 'err-window' : undefined}
              className={inputClass(!!errors.window)}
            >
              <option value="">Select one</option>
              {s.callbackWindows.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Anything else?">
            <textarea
              name="message"
              rows={4}
              value={values.message}
              onChange={(e) => setField('message', e.target.value)}
              className={inputClass(false)}
            />
          </Field>

          <button
            type="submit"
            className="cta-button mt-2 self-start rounded-(--radius-md) bg-(--color-primary) px-6 py-3 font-bold text-(--color-on-primary) transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none"
          >
            {s.submitLabel}
          </button>
        </form>
      </div>
    </section>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-(--radius-md) border px-3 py-2 text-base text-(--color-ink) transition-colors duration-150 ease-out motion-reduce:transition-none ${
    hasError ? 'border-(--color-error)' : 'border-(--color-border-strong)'
  }`;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-(--color-ink)">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="text-sm text-(--color-error)">
          {error}
        </span>
      ) : null}
    </label>
  );
}
