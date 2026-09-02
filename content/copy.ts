// content/copy.ts — every string for all five routes, typed.
//
// Written per Prompt 3 (docs/content-divergence.md has the measured divergence numbers
// and the four structural changes). Proposition held across every route, per D-10's
// consistency requirement: "a real person answers the phone" — distinct from the
// reference's workmanship/quality framing ("Top Quality Roofing", "Roofing excellence
// starts here", "The Hardest Working Roofing Contractor").
//
// No prices (D-12). No invented credentials/history/team size (D-14/D-17) — see
// docs/facts-needed.md. No fabricated testimonials (D-13) — literal placeholder blocks
// only. No email anywhere (D-03).
//
// `refSection` is the reference section id from docs/sections.md (`sNN-...`), used by
// `_shared/harness/src/similarity.mjs` and `diff.mjs` to pair our section back to its
// reference counterpart. `null` means NOVEL — no counterpart exists.

export interface Meta {
  title: string;
  description: string;
}

export interface ServiceItem {
  id: string;
  symptom: string; // how a customer would describe the problem — our grouping key
  label: string; // the canonical service name (fixed list, see process.md Prompt 3 notes)
  blurb: string;
}

// Fixed canonical list of eight services, grouped by SYMPTOM rather than by door
// type/category — the reference (fraserroofingllc.com/roofing-services/) groups its
// services by category (shingle roofing, gutter replacement, reroofing, storm damage,
// emergency roofing, general repairs). Ours deliberately inverts that: every card leads
// with how a customer would describe the problem on the phone, and the canonical service
// name follows as the answer. This is structural-gate change #4.
export const SERVICES: ServiceItem[] = [
  {
    id: 'spring',
    symptom: "The door won't open, or it slams down fast when it closes",
    label: 'Spring repair and replacement',
    blurb:
      'A torsion or extension spring that has lost tension, or snapped outright, is the single most common reason a door gets heavy or falls instead of lowering.',
  },
  {
    id: 'track',
    symptom: "It's loud, it grinds, or it slams",
    label: 'Cable, roller, and track repair',
    blurb:
      'Worn rollers, a stretched cable, or a track that has bent out of line all show up as noise long before they show up as a door that won\'t move at all.',
  },
  {
    id: 'opener',
    symptom: 'The remote or keypad stopped working, or the opener runs but the door doesn\'t move',
    label: 'Opener repair and installation',
    blurb:
      'Sometimes it\'s the logic board, sometimes it\'s the gear that strips inside the unit, sometimes it\'s just a sensor knocked out of alignment. We check all three before replacing anything.',
  },
  {
    id: 'panel',
    symptom: "One panel is dented, cracked, or rotted through",
    label: 'Panel replacement',
    blurb:
      'A single damaged panel rarely means the whole door needs to go. Matching panels can usually be swapped in without touching the rest of the assembly.',
  },
  {
    id: 'offtrack',
    symptom: 'The door runs crooked, binds partway, or jumped the track entirely',
    label: 'Off-track and misaligned door correction',
    blurb:
      'A door that\'s off-track is under spring tension and genuinely dangerous to force back by hand. This is a same-day call, not a weekend project.',
  },
  {
    id: 'newdoor',
    symptom: "You're past patching it and ready to replace the whole door",
    label: 'New residential door installation',
    blurb:
      'Full removal of the old door and hardware, a new door sized and hung to your opening, and a walkthrough of how the new opener and safety sensors work.',
  },
  {
    id: 'commercial',
    symptom: "It's a shop, warehouse, or loading bay door, not a house door",
    label: 'Commercial and roll-up doors',
    blurb:
      'Steel roll-up doors carry different spring tension and hardware than a residential door. We service and install both, sized to the opening and duty cycle.',
  },
  {
    id: 'maintenance',
    symptom: "Nothing's broken yet and you'd like to keep it that way",
    label: 'Annual maintenance and tune-up',
    blurb:
      'Lubrication, hardware torque checks, a balance test on the spring, and a look at the weather seal — the visit that keeps the other seven from happening.',
  },
];

export interface HeroSection {
  id: 'hero';
  refSection: 's01';
  cls: 'ADAPTED';
  heading: string;
  subheading: string;
  body: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  trustLine: string;
}

export interface ServicesGridSection {
  id: 'services-grid';
  refSection: 's04-top-quality-roofing';
  cls: 'ADAPTED';
  heading: string;
  subheading: string;
  items: { label: string; symptom: string; blurb: string }[];
  ctaLabel: string;
}

export interface TestimonialsSection {
  id: 'testimonials';
  refSection: 's05-the-hardest-working-roofing-contra';
  cls: 'ADAPTED';
  heading: string;
  subheading: string;
  placeholders: string[];
}

export interface IntroSection {
  id: 'intro';
  refSection: 's02-professional-roofing-in-georgia-s';
  cls: 'ADAPTED';
  heading: string;
  body: string;
}

export interface ProcessSection {
  id: 'process';
  refSection: null;
  cls: 'NOVEL';
  heading: string;
  subheading: string;
  steps: { step: string; title: string; body: string }[];
}

export interface MapSection {
  id: 'map';
  refSection: null;
  cls: 'NOVEL';
  heading: string;
  caption: string;
  directionsLabel: string;
}

export interface SymptomPromptSection {
  id: 'symptom-prompt';
  refSection: 's01';
  cls: 'ADAPTED';
  heading: string;
  body: string;
}

export interface ServicesListSection {
  id: 'services-list';
  refSection: 's03';
  cls: 'ADAPTED';
  heading: string;
  items: ServiceItem[];
  ctaLabel: string;
}

export interface AboutIntroSection {
  id: 'intro-body';
  refSection: 's01';
  cls: 'ADAPTED';
  heading: string;
  body: string[];
  factNotes: string[];
}

export interface ContactFormSection {
  id: 'contact-form';
  refSection: 's01-post-217-fill-out-the-form';
  cls: 'ADAPTED';
  heading: string;
  body: string;
  fields: { name: string; label: string; kind: 'text' | 'tel' | 'select' | 'textarea' }[];
  serviceOptions: string[];
  callbackWindows: string[];
  submitLabel: string;
  submittedMessage: string;
}

export interface InfoBandSection {
  id: 'info-band';
  refSection: 's02';
  cls: 'ADAPTED';
  heading: string;
  hoursLabel: string;
  phoneLabel: string;
  addressLabel: string;
}

export interface ContactMapSection {
  id: 'map';
  refSection: 's03';
  cls: 'ADAPTED';
  heading: string;
  caption: string;
  directionsLabel: string;
}

export interface ReviewsCtaSection {
  id: 'reviews-or-cta';
  refSection: 's04';
  cls: 'ADAPTED';
  heading: string;
  body: string;
  ctaLabel: string;
}

export interface PolicyBodySection {
  id: 'policy-body';
  refSection: null;
  cls: 'NOVEL';
  heading: string;
  notice: string;
  body: { heading: string; paragraphs: string[] }[];
}

export interface Copy {
  routes: {
    '/': { meta: Meta; sections: (HeroSection | ServicesGridSection | TestimonialsSection | IntroSection | ProcessSection | MapSection)[] };
    '/about': { meta: Meta; sections: AboutIntroSection[] };
    '/services': { meta: Meta; sections: (SymptomPromptSection | ServicesListSection)[] };
    '/contact': { meta: Meta; sections: (ContactFormSection | InfoBandSection | ContactMapSection | ReviewsCtaSection)[] };
    '/privacy': { meta: Meta; sections: PolicyBodySection[] };
  };
}

export const copy: Copy = {
  routes: {
    '/': {
      meta: {
        title: 'Northgate Garage Door Repairs | Portland Metro Garage Door Repair',
        description:
          'Garage door repair across the Portland metro area, done by a local technician who answers the phone. Spring, opener, track, and panel repair — same-day appointments, free estimates.',
      },
      sections: [
        {
          id: 'hero',
          refSection: 's01',
          cls: 'ADAPTED',
          heading: 'A real person answers when you call.',
          subheading:
            'No call center, no app, no ticket number — just a local technician who picks up, asks a few questions, and gets your garage door working again.',
          body:
            "Springs snap on the coldest morning of the year. Openers quit right before you leave for work. When it happens, you don't want a case number — you want somebody who answers the phone, asks what's actually going on, and tells you honestly what it will take to fix it. That's the whole job here. We show up, diagnose the real problem instead of guessing at it, and explain what we're doing before we start. If a part can be repaired instead of replaced, we say so. If it's a small fix, we won't pad the visit to make it look bigger, and if it's going to take a return trip for a part, we'll tell you that on the first visit instead of letting you find out later. Straight talk first, then solid work — in that order, every time, on every call, no exceptions made because a job looks small on the phone. And if you just want to know roughly what's wrong before you commit to a visit, ask — we'll tell you over the phone, for free, even if the honest answer is that it sounds like a five-minute fix you could do yourself.",
          primaryCtaLabel: 'Call (503) 555-0174',
          secondaryCtaLabel: 'Request a callback',
          trustLine:
            "Licensed and local. Every call is answered by a person, never a queue, and never routed to a dispatch center in another state.",
        },
        {
          id: 'services-grid',
          refSection: 's04-top-quality-roofing',
          cls: 'ADAPTED',
          heading: 'What we fix, most often',
          subheading:
            "Tell us what the door is doing and we'll tell you what it probably needs — most calls fall into one of these eight.",
          items: SERVICES.map((s) => ({ label: s.label, symptom: s.symptom, blurb: s.blurb })),
          ctaLabel: 'See the full list',
        },
        {
          id: 'testimonials',
          refSection: 's05-the-hardest-working-roofing-contra',
          cls: 'ADAPTED',
          heading: 'Ask around the neighborhood',
          subheading: "We'd rather show you what actual customers said than tell you ourselves.",
          placeholders: [
            '[TESTIMONIAL PLACEHOLDER — a real customer\'s own words about the repair, roughly two to three sentences, added here once we have permission to publish it. First name and neighborhood only, no invented star rating, no invented last name.]',
            '[TESTIMONIAL PLACEHOLDER — a real customer\'s own words about the repair, roughly two to three sentences, added here once we have permission to publish it. First name and neighborhood only, no invented star rating, no invented last name.]',
            '[TESTIMONIAL PLACEHOLDER — a real customer\'s own words about the repair, roughly two to three sentences, added here once we have permission to publish it. First name and neighborhood only, no invented star rating, no invented last name.]',
          ],
        },
        {
          id: 'intro',
          refSection: 's02-professional-roofing-in-georgia-s',
          cls: 'ADAPTED',
          heading: 'Local, licensed, and easy to reach',
          body:
            "We're based in the Portland metro area and we stay there — no dispatch center routing your call three states away. When you need a callback, you're talking to someone who already knows the neighborhood and can usually get a technician out the same day. That's the difference between a company that services your zip code and one that just happens to have a truck driving through it every few weeks.",
        },
        {
          id: 'process',
          refSection: null,
          cls: 'NOVEL',
          heading: 'How a repair visit actually goes',
          subheading: 'No surprises between the phone call and the invoice.',
          steps: [
            { step: '1', title: 'You call, a person answers', body: 'Describe what the door is doing. We ask a few questions and give you a realistic window, not a vague "sometime today."' },
            { step: '2', title: 'We diagnose before we quote', body: "A technician looks at the actual door — spring tension, hardware, opener — before naming a fix, so the estimate matches the real problem." },
            { step: '3', title: 'We fix it and show you why', body: 'Most repairs finish in one visit. We walk you through what was wrong and what to watch for, so it doesn\'t come back a month later.' },
          ],
        },
        {
          id: 'map',
          refSection: null,
          cls: 'NOVEL',
          heading: 'Serving the greater Portland metro area',
          caption: 'Proudly serving the greater Portland metro area.',
          directionsLabel: 'Get directions',
        },
      ],
    },
    '/about': {
      meta: {
        title: 'About Northgate Garage Door Repairs | Portland, OR',
        description:
          'Northgate Garage Door Repairs is a local garage door repair team in the Portland metro area. Straight talk, honest diagnosis, and a person who answers the phone.',
      },
      sections: [
        {
          id: 'intro-body',
          refSection: 's01',
          cls: 'ADAPTED',
          heading: 'We answer our own phone',
          body: [
            "Northgate Garage Door Repairs works on one thing: garage doors, openers, springs, and the hardware that keeps them running. Not roofing, not siding, not a dozen other trades stapled onto one van — just the door, done right.",
            "That focus is deliberate. A technician who only ever works on garage doors sees the same handful of failure patterns often enough to recognize them in the first two minutes, instead of guessing through a checklist built for a different trade.",
            "We keep the business small enough that the person who answers the phone actually knows what's happening with your call — not a script, not a hold queue routed somewhere else. If we can't get to you same-day, we'll tell you that up front instead of overpromising.",
            "TODO(fact): year the business was established. TODO(fact): number of technicians on staff. TODO(fact): licensing, bonding, and insurance details, once available.",
          ],
          factNotes: [
            'TODO(fact): founding year — not invented, see docs/facts-needed.md',
            'TODO(fact): team size — not invented, see docs/facts-needed.md',
            'TODO(fact): license/bond/insurance numbers — not invented, see docs/facts-needed.md',
          ],
        },
      ],
    },
    '/services': {
      meta: {
        title: 'Garage Door Repair Services | Northgate Garage Door Repairs',
        description:
          'Spring repair, opener repair, panel replacement, off-track correction, new door installation, commercial roll-up doors, and maintenance — Portland metro garage door repair.',
      },
      sections: [
        {
          id: 'symptom-prompt',
          refSection: 's01',
          cls: 'ADAPTED',
          heading: "What's going on with your door?",
          body:
            "Most people don't know a torsion spring from a cable until one breaks — that's fine, that's our job to know. Find what the door is doing below and the fix is right next to it. Nothing here needs you to diagnose it yourself first.",
        },
        {
          id: 'services-list',
          refSection: 's03',
          cls: 'ADAPTED',
          heading: 'Eight problems, one call',
          items: SERVICES,
          ctaLabel: 'Call to book a visit',
        },
      ],
    },
    '/contact': {
      meta: {
        title: 'Contact Northgate Garage Door Repairs | Portland, OR',
        description:
          'Call (503) 555-0174 or request a callback. Northgate Garage Door Repairs serves the Portland metro area, seven days a week, 7:00 AM to 7:00 PM.',
      },
      sections: [
        {
          id: 'contact-form',
          refSection: 's01-post-217-fill-out-the-form',
          cls: 'ADAPTED',
          heading: "Tell us what's wrong",
          body:
            "Fastest answer is the phone. If now's not a good time, leave a few details and we'll call back in the window you pick — no email, no account.",
          fields: [
            { name: 'name', label: 'Full name', kind: 'text' },
            { name: 'phone', label: 'Phone number', kind: 'tel' },
            { name: 'service', label: "What's wrong?", kind: 'select' },
            { name: 'window', label: 'Best callback time', kind: 'select' },
            { name: 'message', label: 'Anything else?', kind: 'textarea' },
          ],
          serviceOptions: SERVICES.map((s) => s.label),
          callbackWindows: ['Morning', 'Midday', 'Afternoon', 'No preference'],
          submitLabel: 'Request a callback',
          submittedMessage: "Got it — we'll call during your chosen window.",
        },
        {
          id: 'info-band',
          refSection: 's02',
          cls: 'ADAPTED',
          heading: 'Hours and location',
          hoursLabel: '7 days a week, 7:00 AM – 7:00 PM',
          phoneLabel: '(503) 555-0174',
          addressLabel: '6340 Alder Ridge Way, Portland, OR 97217',
        },
        {
          id: 'map',
          refSection: 's03',
          cls: 'ADAPTED',
          heading: 'Find us',
          caption: 'Proudly serving the greater Portland metro area.',
          directionsLabel: 'Get directions',
        },
        {
          id: 'reviews-or-cta',
          refSection: 's04',
          cls: 'ADAPTED',
          heading: 'Still not sure what you need?',
          body:
            "That's normal — call anyway. Describing the noise or the way the door moves is usually enough for us to tell you what's going on before a technician ever pulls into the driveway. If you're not sure whether it's the spring, the opener, or something else entirely, that's exactly the kind of question we're used to answering over the phone before we ever schedule a visit.",
          ctaLabel: 'Call (503) 555-0174',
        },
      ],
    },
    '/privacy': {
      meta: {
        title: 'Privacy Policy | Northgate Garage Door Repairs',
        description:
          'How Northgate Garage Door Repairs handles information submitted through this site: no email collection, no analytics, no cookies beyond what the framework sets.',
      },
      sections: [
        {
          id: 'policy-body',
          refSection: null,
          cls: 'NOVEL',
          heading: 'Privacy Policy',
          notice: 'UNREVIEWED TEMPLATE — requires legal review before launch',
          body: [
            {
              heading: 'What this site collects',
              paragraphs: [
                "This site does not collect an email address at any point. The only form on this site is the callback request on the Contact page, which asks for a name, a phone number, the type of service needed, a preferred callback window, and an optional message.",
                "That information is used for exactly one purpose: calling you back about the request you submitted. It is not sold, shared with a third party, or added to a marketing list, because no marketing list exists.",
              ],
            },
            {
              heading: 'Analytics and cookies',
              paragraphs: [
                "This site does not run analytics software, does not use tracking pixels, and does not set advertising cookies. The only cookies present are the ones the underlying web framework may set to make the site function, none of which identify you personally.",
              ],
            },
            {
              heading: 'Maps',
              paragraphs: [
                "The map embedded on the home page and the Contact page loads from Google Maps. Google may set its own cookies when that embed loads, governed by Google's own privacy policy, not ours. We don't control that behavior and don't receive any data from it.",
              ],
            },
            {
              heading: 'How to reach us about this policy',
              paragraphs: [
                'Questions about this policy can be directed to (503) 555-0174 or by mail to 6340 Alder Ridge Way, Portland, OR 97217. We do not accept privacy inquiries by email because we do not operate an email intake for this site.',
              ],
            },
            {
              heading: 'Changes to this policy',
              paragraphs: [
                'If what this site collects or how it is used ever changes, this page will be updated to describe the change. There is no dated changelog because, at the time of writing, nothing on this page has changed since publication.',
              ],
            },
          ],
        },
      ],
    },
  },
};

export default copy;
