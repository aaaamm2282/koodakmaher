/**
 * Map listings for each unit: Neshan, Balad and Google Maps.
 *
 * Only what is specific to the listings lives here (categories, the short code used in review links).
 * Name, address, phone, hours and links come from the unit files (src/content/units/*.json), the same
 * data the site shows, so a listing never says something the site does not.
 *
 * Google Business Profile (the owner's dashboard: verification, replies to reviews, posts) does not
 * support businesses in Iran, because of US sanctions:
 * https://support.google.com/business/answer/6270107
 * On Google Maps a place can still be added with «Add a missing place» and corrected with «Suggest an
 * edit», and anyone can review it. The review link then comes from the place's Place ID (googleReviewUrl).
 *
 * Used by the review pages (/review/…), the QR posters, the unit pages and `npm run local:profiles`
 * (docs/local-profiles.md).
 */

/**
 * Google stopped reviews for "general education schools" (primary and secondary: elementary, middle
 * and high schools) worldwide on 30 April 2025 (۱۰ اردیبهشت ۱۴۰۴). Pre-schools, vocational schools and
 * higher education keep them. Google decides by the place's main category.
 * https://www.seroundtable.com/google-drops-school-reviews-39220.html
 *
 * `google.category` is the English name of the category in Google Maps; `mapCategory` is the nearest
 * category to look for in Neshan and Balad (their lists change, so pick the closest one offered).
 */
export const listings = {
  kindergarten: {
    code: 'kg',
    google: { category: 'Preschool', reviews: true },
    mapCategory: 'مهدکودک و پیش‌دبستانی',
  },
  primary: {
    code: 'pr',
    google: { category: 'Elementary school', reviews: false },
    mapCategory: 'دبستان غیردولتی',
  },
  'middle-school': {
    code: 'ms',
    google: { category: 'Middle school', reviews: false },
    mapCategory: 'دبیرستان دوره اول',
  },
  language: {
    code: 'la',
    google: { category: 'Language school', reviews: true },
    mapCategory: 'آموزشگاه زبان',
  },
  vocational: {
    code: 'vo',
    google: { category: 'Vocational school', reviews: true },
    mapCategory: 'آموزشگاه فنی و حرفه‌ای',
  },
};

/** Address of a page with the tracking tags of the place that links to it (a map listing, an SMS…). */
export function tagged(path, source, medium, campaign) {
  const [base, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  params.set('utm_source', source);
  params.set('utm_medium', medium);
  params.set('utm_campaign', campaign);
  return `${base}?${params.toString()}`;
}

/** Google's "write a review" link for a place, from its Place ID (Google's Place ID Finder shows it). */
export const googleReviewUrl = (placeId) => `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;

/** Where a review link goes: the unit's review page, tagged by the channel that carried it. */
export const reviewPath = (slug) => `/review/${slug}/`;
export const shortReviewPath = (slug) => `/r/${listings[slug].code}/`;

/**
 * The places a parent can review this unit, in the order the review page shows them. Google only for
 * the units whose category Google takes reviews for, even if a link was entered by mistake.
 */
export function reviewLinks(u) {
  const l = listings[u.slug];
  if (!l || u.soon) return [];
  return [
    l.google.reviews && u.reviewUrl ? { app: 'google', href: u.reviewUrl, label: 'نوشتن نظر در گوگل' } : null,
    u.mapUrl ? { app: 'neshan', href: u.mapUrl, label: 'امتیاز و نظر در نشان' } : null,
    u.baladUrl ? { app: 'balad', href: u.baladUrl, label: 'امتیاز و نظر در بلد' } : null,
  ].filter((x) => x !== null);
}
