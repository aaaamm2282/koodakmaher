---
name: ui-ux-chart
description: Charts, key figures (KPIs) and reporting pages. Use when a chart, a KPI, a statistic, a report or a dashboard is planned, built or reviewed, when numbers over time, shares or comparisons are to be shown, or when colors, axes, legends or tooltips of a chart are involved; together with ui-ux.
---

# Charts and key figures

Principle: a chart answers **one** question that its heading asks ("How many first consultations per
month?"). Every number in it is also available as a table or as text. First ask whether a table or a
single key figure is enough: in day-to-day work it usually is. A chart pays off where a trend, a share
or a comparison has to be seen at a glance (statistics, reports, management).

Sources: the data visualization guidance of mature design systems (chart anatomy, axes and labels,
legends, color palettes, dashboards) and the principles of this suite. The component lives in your
design system mapping.

## Which form

| Question | Form |
|---|---|
| One number people need right away ("12 open") | Key figure (`chart.kpi`) |
| Trend over time | Line or area, time axis old on the left, new on the right |
| Comparing a few groups | Bars, axis **starting at 0** |
| Share of a whole, at most five parts | Donut with the total in the middle; more parts → bars |
| Many values, exact numbers | Table (`ui-ux-table`), no chart |

## Behaves

| Key | Rule | Trap |
|---|---|---|
| `chart.loading` | Skeleton shaped like the chart, space reserved | The page jumps when the chart arrives |
| `chart.empty` | Sentence saying what will appear here and from when ("No first consultations in this period yet"), changing the period as the way out | Empty axes without explanation |
| `chart.error` | Message with "Reload" where the chart would be; the rest of the page stays | Whole page turns red |
| `chart.axis` | Numeric axis of bars and areas starts at 0, even steps, unit in the axis title, numbers formatted per locale | A truncated axis makes small differences look big |
| `chart.legend` | Legend visible (bottom), at most two lines, then "Show more"; with a single series no legend, the heading is enough | Hidden legend, color without a name |
| `chart.tooltip` | Value, unit and category on hover and on keyboard focus; never replaces labels | Information only in the tooltip |
| `chart.color` | Colors from the design system's data palette, the same per category everywhere; status colors only for status; never color alone (pattern, label) | Red/green as the only difference |
| `chart.table` | The same data as a table, switchable or below; export via the table | Numbers only in the picture |
| `chart.kpi` | Big number, one-word description, period and as-of time ("as of 9 Nov, 10:42"); clicking leads to the list behind it | Number without reference or period |
| `chart.dashboard` | Most important top left, at most four to six key figures, same color per category across all charts, white space instead of borders | Everything the same size, colors new per chart |

Required as for every container: `chart.loading`, `chart.empty`, `chart.error`; plus `chart.table`.

## Content

- The heading is the question or the statement, not the chart type ("First consultations per month",
  never "Bar chart").
- Period and as-of time are visible at the chart; the period is a filter per `ui-ux-date` (`date.preset`).
- No personal data in charts; reports show counts, never names. Merge small groups (under 5) when
  people could otherwise be identified.
- Use the domain's own terms, as your users and official statistics use them.

## Accessibility

- The chart has a name (heading) and a short text summary ("34 in October, ten more than in
  September"); the table (`chart.table`) is the full path for screen readers.
- Data points reachable by keyboard, tooltip appears on focus; focus visible.
- Data colors have at least 3:1 contrast against the background (WCAG 1.4.11); never color alone.
- Motion (animation on load) respects reduced motion.

## Responsive

- At 1024 px charts stack instead of sitting side by side; shorten axis labels instead of rotating them.
- At 375 px key figures and the table instead of the chart; the legend stays visible (hide it only
  when there is a single series).
- No horizontal scrolling; condense long time series (weeks → months).

## Common mistakes

- A chart where a number or a table would do; a pie with twelve slices.
- The axis does not start at 0; different colors for the same category.
- No empty state; numbers only in the picture; unclear period.

## Checklist

- [ ] Does the chart answer a question its heading asks?
- [ ] Would a key figure or a table be enough?
- [ ] Loading, empty, error and table defined?
- [ ] Axis from 0, unit, period, as-of time visible?
- [ ] Colors from the data palette, the same per category, never alone?
- [ ] No personal data, small groups merged?
- [ ] 1024 px and 375 px checked, keyboard reaches the values?

Heuristics (`../ui-ux/references/masters.md`): H1 as-of time and period visible, H2 the heading asks the users'
question, H8 a key figure or table when a chart adds nothing.

Implementation: the mapping of these keys in your design system mapping
(`references/design-system-mapping.md`).
