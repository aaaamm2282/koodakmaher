---
name: ui-ux-tabs
description: Tabs. Use when a page is split into tabs, a tab is added or removed, tabs should live in the URL, input is lost when switching tabs, errors sit in another tab, or tabs do not fit on narrow screens.
---

# Tabs

Principle: tabs split **one** object into equal-ranking views (a record: overview, history, documents).
They are not navigation between areas and not a wizard.

## When tabs

| Situation | Pattern |
|---|---|
| Equal-ranking views of one object, each usable alone | Tabs |
| Areas of the app | Side navigation |
| Fixed order, each step depends on the previous | Step sequence, no tabs |
| Two or three short sections | One page with headings |
| More than about 7 views | Group them or use sub-pages |

## Behaves

| Key | Rule | Trap |
|---|---|---|
| `tab.selected` | Active tab clear; content immediately, loading inside the tab (`page.loading`) | Whole page reloads |
| `tab.route` | Tab lives in the URL; back, sharing a link and reload land on the same tab | Tab jumps to the first after reload |
| `tab.dirty` | Unsaved changes in a tab → marker on the tab; switching keeps the draft or asks (`form.dirtyGuard`) | Switching discards silently |
| `tab.invalid` | Error in another tab → marker on the tab + error summary with a link there | Saving fails, error invisible |
| `tab.overflow` | Too many for the width → scrollable with arrows or a select list | Tabs cut off |
| `tab.disabled` | Prefer hiding; if blocked, say why | Grey tab without a reason |

Order by frequency; the first tab is the most frequent task. Labels short, nouns, with a count
where helpful ("Claims (12)").

## Accessibility

- Roles `tablist`/`tab`/`tabpanel`, panel linked via `aria-controls`, panel has a name.
- Arrow keys switch between tabs, Tab moves into the panel; Home/End first/last.
- Markers (`tab.dirty`, `tab.invalid`) have text for screen readers, not only a dot or colour.
- After switching, focus stays on the tab; no automatic jump into the panel.

## Responsive

- At 1024 px all tabs visible or `tab.overflow`; at 375 px overflow or a select list, never a
  horizontally scrolling page.
- Tab content follows the rules of its container (table, form).

## Common mistakes

- Tabs as a wizard with a mandatory order.
- Tabs not in the URL.
- Input lost when switching.
- Error in the hidden tab.
- Frame (header, menu) changes or disappears on one tab.

## Checklist

- [ ] Are tabs the right pattern (not navigation, not steps)?
- [ ] Frame (header, menu, side navigation) the same on every tab, no sudden empty space?
- [ ] In the URL, reload stays on the tab?
- [ ] Unsaved changes and errors marked on the tab, with text?
- [ ] Arrow keys and panel linkage?
- [ ] Overflow handled at 1024/375 px?

Heuristics (`../ui-ux/references/masters.md`): H3 no silent loss when switching (`tab.dirty`), H4 consistency (stable frame), H6 recognition.

Implementation: mapping of the keys in the design-system mapping (`ui-ux/references/design-system-mapping.md`).
