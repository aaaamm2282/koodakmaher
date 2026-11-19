---
name: ui-ux-date
description: Dates, times and periods. Use when a date field, calendar, date-range filter, time, deadline, date of birth or appointment is entered, displayed or validated, or when date format, blocked days or time zones matter.
---

# Date and time

Principle: **choose the pattern by purpose, not by looks. Typing is always allowed**; the calendar
complements, never replaces. A wrong day can cost a deadline.

## Purpose → pattern

| Purpose | Example | Key | Pattern |
|---|---|---|---|
| Known date | Date of birth, letter dated | `date.single` | Text field with format, **without** calendar |
| Date nearby | Deadline, follow-up | `date.single` | Text field + calendar, opens on a useful month |
| Date + time | Appointment | `date.dateTime` | Date + time field; show zone only when it differs |
| Period | Deadline list filter, statistics | `date.range` | **One** component (from/to validated together), end < start prevented |
| Named period | "this week", "last 30 days", "quarter" | `date.preset` | Presets first, custom range as the last option |
| Recurring | "every Monday", monthly instalments | `date.relative` | Own expression input, no day grid |

Never three dropdowns (day/month/year). Never a read-only field that only works via the calendar.
Build presets only where there is evidence (usage logs of filters; otherwise ask users).

## Rules

- **Format visible** in the label or help ("DD.MM.YYYY"), not only as placeholder; format and
  language come from the locale formatter, never by hand.
- **Parse tolerantly:** `5.3.80`, `05.03.1980`, `5-3-1980` become one date; resolve a two-digit year
  by purpose (date of birth into the past, deadline into the future).
- **`date.unavailable`:** min/max, holidays, closing days not selectable in the calendar and
  explained, not rejected only on submit.
- **`date.invalid`:** problem + suggestion ("31 Feb does not exist. Did you mean 28 Feb?");
  plausibility: date of birth not in the future and not over 120 years ago, end not before start,
  weekend deadline as `field.warning`.
- **Display:** the closed field shows the date readably in the local format, never raw ISO text.
- **Time zone:** compute in the zone of the organisation. Show the zone only when an appointment
  comes from another zone (calendar sync); then show both values.
- **Build:** use the design system's component; build your own only for presets, recurrence or
  blocked days, and then on its accessible foundation.

## Accessibility

- The typed path is the most accessible and always complete.
- Calendar: arrows = day/week, page up/down = month, Enter selects, Escape closes with focus back
  in the field; days have full names ("Monday, 3 November 2026"), today and selected announced.
- Format help via `aria-describedby`; range fields are named "Period from" / "Period to".

## Responsive

- At 375 px calendar full width or full screen; range parts stacked.
- No layout shift on opening; presets as a list instead of a bar.

## Common mistakes

- Calendar only; three dropdowns; format only in the placeholder.
- Period as two independent single fields without validation.
- Invalid days only on submit.
- Native date field mixed with design-system field (two ways of operating).

## Checklist

- [ ] Pattern fits the purpose?
- [ ] Typing possible, tolerant, format visible?
- [ ] Presets for frequent periods (where evidenced)?
- [ ] Range linked, end < start prevented?
- [ ] Blocked days shown in advance, errors with a suggestion?
- [ ] Keyboard contract and announcements checked, 375 px?

Heuristics (`../ui-ux/references/masters.md`): H5 error prevention (blocked days), H6 recognition.

Implementation: mapping of the keys in the design-system mapping (`ui-ux/references/design-system-mapping.md`).
