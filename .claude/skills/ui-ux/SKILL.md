---
name: ui-ux
description: Entry point of the UI/UX Behaves suite. Use when a page, flow, table, form, dialog, tabs, notification, date input or setting is planned, built, reviewed or described as a ticket with acceptance criteria, or when states (empty, loading, error, warning) are missing.
---

# UI/UX Behaves

The suite is fixed. **Only the design system is interchangeable.** The sub-skills speak in behaves
(`table.noResults`, `field.invalid`) and token roles ("error colour", "spacing 05"), never in the
components of a particular design system. Which component implements a behave is written once in
the design-system mapping (`references/design-system-mapping.md`, copied into your design-system
skill and filled in). Switching design systems means a new mapping with the same keys.

## Sub-skills

| Topic | Skill |
|---|---|
| List, table | `ui-ux-table` |
| Form, field, toggle | `ui-ux-form` |
| Date, time, range | `ui-ux-date` |
| User action, delete, send, permissions | `ui-ux-active` |
| System feedback, loading, notification | `ui-ux-passive` |
| Tabs | `ui-ux-tabs` |
| Dialog, side panel | `ui-ux-dialog` |
| Chart, key figure, report | `ui-ux-chart` |

## Behave grid

Every state gets a key `context.state[.severity]` and sits on three axes:

- **Phase:** idle → interact → processing → outcome → recovery → done
- **Semantics:** info · success · warning · error · progress · empty · blocked
- **Trigger:** on-input · on-blur · on-submit · on-async · timed · on-focus

All keys: `references/behave-catalog.md`. A new state is added there first, then mapped in the
design-system mapping.

**Required for every container** (page, table, form, dialog): `loading`, `empty`, `ready`, `error`,
plus `warning` wherever there is risk. Further behaves only where harm or frequency justify them.

## Tools

The plugin ships text only; the checks run with your own search and read tools.

- `/ui-ux-behaves:audit`: counts source patterns that break behaves (spinner over an area, toggle
  in a submitted form, disabled submit, "Are you sure?") and works as a ratchet. Patterns come
  from a config per design system; example for Carbon React in the plugin's `examples/`.
- `/ui-ux-behaves:copy-check`: finds the same word repeated in elements close together, from
  rendered text or an aria snapshot.
- Mapping check: compare the keys between the `behave-keys` markers of `references/behave-catalog.md`
  and of your design-system mapping. Every catalog key appears exactly once, none is left empty,
  and the mapping has no keys the catalog does not know.

- `/ui-ux-behaves:review`: one screen against the behaves and the masters, heuristics H1 to H10
  answered one by one.
- `/ui-ux-behaves:walkthrough`: one task step by step from a newcomer's view, four questions per
  step (cognitive walkthrough, `references/cognitive-walkthrough.md`).

The audit only finds patterns. A clean run does not prove that states exist; that is the review.

## Who uses the app

Before designing, write down the roles, the setting (office, field, phone) and how often people are
interrupted, from evidence: user messages, tickets with acceptance criteria, usage logs, legacy data,
help pages, domain rules. Everything else is an assumption with its cheapest test. No invented
personas or numbers.

**Depth of method:** convention or bug → finding, severity, fix. Core or costly task → cognitive
walkthrough of that task before release. New page with an open question → brief, three concepts,
recommendation in a plan document. Large initiative without a task → frame it first.

## Principles of the masters (apply everywhere)

Norman, Nielsen, Gestalt, UX writing, sound, respect and helpful feedback, with check questions
and cases: `references/masters.md`.

- **Mapping and feedback:** the effect is visible where the user acts. If it happens elsewhere, the
  label says where (no "basement switch").
- **Stable frame:** header, menu and side navigation stay the same on every tab; sudden empty space
  reads as contrast.
- **Proximity and white space:** spacing shows what belongs together; white space is intended,
  never a leftover.
- **No stuttering:** the same word not twice in close proximity; the heading carries the term.

## Accessibility (applies everywhere)

Target WCAG 2.2 AA. Every control has a name, role and state; focus is visible, order follows
meaning, and focus is set deliberately after dialogs and errors; messages use a live region; never
colour alone. Check with axe in an end-to-end test (nothing "serious" or "critical") and a keyboard
walkthrough. Never claim "compliant" from a scan alone.

## Responsive (applies everywhere)

Desktop first for office software: 1280 px full, 1024 px good, 375 px read and main action; usable
at 200 % zoom; never scroll horizontally. Translations can be about 30 % longer. Every sub-skill
says what drops away on narrow screens.

## Language (applies everywhere)

Sentence case, no full stop at the end of labels, buttons and titles. Buttons are verb + noun
("Save changes"), never "OK". Use the terms of the users' daily work, not the system's internals
(H2). Say it once: what the heading already says is not repeated below it (H8).

## Feedback that helps (applies everywhere)

Nobody is left stranded. Every hint, warning, error, block and empty state says what happened in
the users' words, whether it was them or the system, what they can do now and what is kept. Every
one offers at least one action that moves the person forward, and a way to reach a person where
the task matters. The tone is calm and kind, describes the situation and never the person, and
states high standards with confidence that they can be met. Help grows with the difficulty:
prevent, explain in place, guide on the first problem, more help on repetition, then a person.
Pattern, examples and the Stanford and Harvard research it rests on:
`references/helpful-feedback.md`.

## Help (applies everywhere)

Every flow has help made of concrete steps, reachable from the page where the flow starts, and
searchable (H10). Help in context comes first: format next to the field, a "How it works" link at a
blocked action, more help after the same error repeats. Frequent users get shortcuts and remembered
settings, and hints they dismissed stay dismissed (H7). A help page is not an excuse for a screen
that cannot be understood without it.

## Acceptance criteria

Numbered, observable; each becomes a test step:

- "Given [situation], when [action], then [visible result]."
- "With the keyboard alone, one can [task] without [obstacle]."
- "A screen reader announces [name/state/message]."
- "If [operation] fails, [data] is kept and [way out] is offered."
- "When [problem] occurs a second time, [example or help link] is shown at [place]."
- "At [width/zoom], [content] stays readable and usable."
