/**
 * Analytics events from page scripts (forms, the 404 page, the age-path explorer).
 *
 * Events wait in `window.kmq`; src/components/Analytics.astro sends them to Google Analytics or Umami
 * when one of them is set up (PUBLIC_GA4_ID, PUBLIC_UMAMI_*). Without either, nothing is sent and
 * nothing is loaded. Never put names, phone numbers or message text in `params`.
 */
export type TrackParams = Record<string, string | number | undefined>;

export function track(name: string, params: TrackParams = {}) {
  const w = window as unknown as { kmq?: [string, TrackParams][] };
  (w.kmq ||= []).push([name, params]);
}

/** The visit's first page, the site it came from and its UTM tags (saved by Base.astro). */
export function visitSource(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem('km:src') || '{}');
  } catch {
    return {};
  }
}
