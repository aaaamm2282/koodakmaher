---
name: ui-ux-table
description: Tables and lists. Use when a list or table is created, rebuilt or reviewed, when empty state, filter, search, sorting, selection, bulk actions, row actions, inline editing, pagination or columns are involved; together with ui-ux.
---

# Tables

Principle: a table always shows **what** it shows, **how much** of it and **why nothing**. Build
new lists only with the design system's table component (or your app's table standard). It already
knows most behaves; do not rebuild any of them.

## Behaves

| Key | Rule | Trap |
|---|---|---|
| `table.loading` | Skeleton shaped like the table | Spinner; empty state flashes before the data |
| `table.empty` | Sentence saying what will appear here + primary action (if allowed) | Looks like `noResults` |
| `table.noResults` | Sentence with search term/filter + "Reset filters" | User thinks data is lost |
| `table.loadError` | Message with "Reload"; filters and search stay | Empty table without a reason |
| `table.sorted` | Column and direction always visible, default fixed per list | Sorting only in the developer's head |
| `table.filtered` | Active filters as removable tags + count; filters in the URL | Hidden filter from the last session |
| `table.selected` | Selection per row, "all" with indeterminate state | "All" means only this page without saying so |
| `table.bulkActions` | Bar appears on selection, states the count; destructive → `ui-ux-active` | Bulk delete without scope |
| `table.rowActions` | 1–2 frequent ones visible, rest in the menu; destructive separate, at the bottom | "Delete" next to "Open" |
| `table.inlineEdit` / `cell.invalid` | Error in the same row; with several, also a summary at the top | Error as a toast |
| `table.expanded` | Expand via a button with state (open/closed) | Only a click on the row |
| `table.scale` | "X–Y of Z", pages from 25 rows | List without a total |
| `table.density` / `table.columns` | Density and columns selectable, remembered per user | Setting lost on reload |

**Toolbar:** only search, filter button, menu "More actions" and on the right **one** primary action.
Toggles and dropdowns belong in the filter flyout, never in the toolbar.

## Accessibility

- Real table semantics (header, rows, cells); the sort button announces direction (`aria-sort`).
- Result count after search/filter in a live region ("12 results") without moving focus.
- A clickable row has a real link in the first cell; the row menu is keyboard reachable.
- After a bulk action or delete, focus goes to the neighbouring row or the toolbar, never nowhere.
- Checkboxes name the row ("Select invoice 1042").

## Responsive

- Every column has a priority; below 1024 px secondary columns drop, at 375 px name and main value
  remain. Never scroll horizontally.
- Long tables: header stays put. Row actions stay reachable via the menu at 375 px.

## Common mistakes

- One "nothing here" state for both `empty` and `noResults`.
- Spinner instead of skeleton; spinner over the whole page.
- Total missing; "select all" without scope.
- Custom table instead of the standard component.

## Checklist

- [ ] `loading`, `empty`, `noResults`, `loadError` separate and with a way out?
- [ ] Filters visible, removable, in the URL?
- [ ] "X of Y" visible?
- [ ] Destructive actions separate, with a way back?
- [ ] Column priorities set for 1024/375 px?
- [ ] Count via live region, focus after action defined?

Heuristics (`../ui-ux/references/masters.md`): H6 recognition, H7 efficiency (remembered filters, columns).

Implementation: mapping of the keys in the design-system mapping (`ui-ux/references/design-system-mapping.md`).
