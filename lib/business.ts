// lib/business.ts — the single source of truth for every business fact.
// Every component reads from here. A hard-coded phone number anywhere else is a bug
// (Prompt 5, item 5). Values come from CLAUDE.md's CONSTANTS block; nothing here is
// invented (D-04/D-06/D-07).

export const business = {
  name: 'Northgate Garage Door Repairs',
  tagline:
    'Straight talk, solid work — garage door repair done by people who answer the phone.',

  // D-04: reserved 555-01XX range, cannot ring a real person.
  phone: {
    display: '(503) 555-0174',
    tel: '+15035550174',
  },

  // D-07: the address is fake; MAP_COORDS are real coordinates used for the map embed.
  // Never pass the address string to a geocoder.
  address: {
    street: '6340 Alder Ridge Way',
    city: 'Portland',
    state: 'OR',
    zip: '97217',
    full: '6340 Alder Ridge Way, Portland, OR 97217',
  },
  geo: {
    lat: 45.5788,
    lng: -122.6929,
  },

  // D-06: single block, seven days, no split hours, no invented "24/7 emergency" claim.
  hours: {
    display: '7 days a week, 7:00 AM – 7:00 PM',
    opens: '07:00',
    closes: '19:00',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const,
  },

  // Footer-only sentence, no city grid (D-02).
  serviceArea: 'Proudly serving the greater Portland metro area.',

  routes: [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/services', label: 'Services' },
    { href: '/contact', label: 'Contact' },
  ] as const,

  // /privacy is a footer-only link, not primary nav (matches the reference, which also
  // keeps its privacy page out of primary nav).
  footerOnlyRoutes: [{ href: '/privacy', label: 'Privacy Policy' }] as const,

  directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=45.5788,-122.6929',
  mapEmbedSrc: (zoom: number) =>
    `https://www.google.com/maps?q=45.5788,-122.6929&z=${zoom}&output=embed`,

  siteUrl: 'https://northgategaragedoorrepairs.site',
} as const;

export type Business = typeof business;
