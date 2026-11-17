/**
 * Structured data (JSON-LD). Rule: only confirmed facts. A value that is null in the content
 * (unknown) is left out, never guessed. Each unit has a stable @id so the organisation on every
 * page and the full description on the unit's own page are read by search engines as one entity.
 */
import { site, social, units, type Unit, type Faq } from '../data/site';

const abs = (path: string, base: URL | string) => new URL(path, base).href;
export const orgId = (base: URL | string) => abs('/#org', base);
export const unitId = (slug: string, base: URL | string) => abs(`/units/${slug}/#unit`, base);

/** schema.org types: the most specific accurate type for each unit. */
const unitType: Record<string, string> = {
  kindergarten: 'Preschool',
  primary: 'ElementarySchool',
  'middle-school': 'MiddleSchool',
};
export const typeOf = (u: Unit) => unitType[u.slug] ?? 'EducationalOrganization';
export const displayName = (u: Unit) => u.officialName ?? `${u.name} کودک ماهر`;

const postalAddress = (street: string | null) =>
  street || site.city
    ? { '@type': 'PostalAddress', ...(street && { streetAddress: street }), ...(site.city && { addressLocality: site.city }), addressCountry: 'IR' }
    : undefined;

export function organization(base: URL | string, image: string) {
  const org: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': orgId(base),
    name: site.name,
    alternateName: [site.brand, 'کودک ماهر مانا', 'ماهر مانا', 'Maher Mana'],
    slogan: site.slogan,
    description: site.mission,
    url: abs('/', base),
    logo: abs('/logo.png', base),
    image,
    ...(site.founder && { founder: { '@type': 'Person', name: site.founder } }),
    // The units, each pointing at its own full description on its page
    subOrganization: units.filter((u) => !u.soon).map((u) => ({ '@type': typeOf(u), '@id': unitId(u.slug, base), name: displayName(u), url: abs(`/units/${u.slug}/`, base) })),
  };
  if (site.phone) org.telephone = site.phone;
  const addr = postalAddress(site.address);
  if (addr && site.address) org.address = addr;
  // foundingYear is a Persian (Hijri Shamsi) year; schema.org foundingDate (ISO 8601) can't express it, so it stays in visible text only.
  if (social.length) org.sameAs = social.map((s) => s.href);
  return org;
}

export function website(base: URL | string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': abs('/#website', base),
    name: site.name,
    alternateName: site.brand,
    url: abs('/', base),
    inLanguage: 'fa-IR',
    publisher: { '@id': orgId(base) },
  };
}

export function breadcrumbs(crumbs: { href?: string; label: string }[], currentPath: string, base: URL | string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ label: 'خانه', href: '/' }, ...crumbs].map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: abs(c.href ?? currentPath, base),
    })),
  };
}

/** Full description of one unit, for its own page. */
export function unit(u: Unit, base: URL | string, extra: { description?: string; image?: string[] } = {}) {
  const sameAs = [u.instagram && `https://instagram.com/${u.instagram.replace(/^@/, '')}`, u.googleMapsUrl, u.baladUrl].filter(Boolean);
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': typeOf(u),
    '@id': unitId(u.slug, base),
    name: displayName(u),
    ...(displayName(u) !== `${u.name} کودک ماهر` && { alternateName: `${u.name} کودک ماهر` }),
    url: abs(`/units/${u.slug}/`, base),
    parentOrganization: { '@id': orgId(base) },
    ...((extra.description ?? u.short) && { description: extra.description ?? u.short }),
    ...(u.address && { address: postalAddress(u.address) }),
    ...(u.geo && { geo: { '@type': 'GeoCoordinates', latitude: u.geo.lat, longitude: u.geo.lng } }),
    ...(u.phone && { telephone: u.phone.tel }),
    ...(u.mapUrl && { hasMap: u.mapUrl }),
    ...(u.openingHours.length && {
      openingHoursSpecification: u.openingHours.map((o) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: o.days.map((d) => `https://schema.org/${d}`), opens: o.opens, closes: o.closes })),
    }),
    ...(sameAs.length && { sameAs }),
    ...(u.manager && { employee: { '@type': 'Person', name: u.manager, jobTitle: `مدیر ${u.name}` } }),
    ...(extra.image?.length && { image: extra.image }),
    logo: abs('/logo.png', base),
  };
  return data;
}

/** FAQPage from confirmed answers only (a question with a pending part is left out). */
export function faqPage(faqs: Faq[] | { q: string; a?: string | null; pending?: string | null }[]) {
  const done = faqs.filter((f) => f.a && !f.pending);
  if (!done.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: done.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}
