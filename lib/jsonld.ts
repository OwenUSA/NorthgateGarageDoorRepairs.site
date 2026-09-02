// LocalBusiness JSON-LD, built entirely from lib/business.ts (Prompt 5, item 7).
// Deliberately excludes: email, aggregateRating, review, priceRange (D-12/D-13/D-15).

import { business } from './business';

export function localBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    telephone: business.phone.tel,
    url: business.siteUrl,
    image: `${business.siteUrl}/placeholders/logo.svg`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address.street,
      addressLocality: business.address.city,
      addressRegion: business.address.state,
      postalCode: business.address.zip,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: business.geo.lat,
      longitude: business.geo.lng,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: business.hours.opens,
      closes: business.hours.closes,
    },
  } as const;
}
