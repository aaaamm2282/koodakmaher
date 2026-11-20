// Form field ids that stay the same from build to build: f-<name>, and f-<name>-2, -3 … if a page has
// the same field name more than once (two forms on one page). A random id changed the page on every build.
const perPage = new WeakMap<Request, Map<string, number>>();

export function fieldId(request: Request, name: string): string {
  let seen = perPage.get(request);
  if (!seen) perPage.set(request, (seen = new Map()));
  const n = (seen.get(name) ?? 0) + 1;
  seen.set(name, n);
  return n === 1 ? `f-${name}` : `f-${name}-${n}`;
}
