---
name: ui-ux-passive
description: System feedback without user action. Use when loading, saving, status, hints, error messages, notifications, toasts, live announcements, stale data, conflicts during concurrent editing, missing permissions or offline states are planned, written or reviewed.
---

# Feedback (passive)

Principle: the system says **unprompted** what is going on, **without interrupting the user**.
Message as close to the object as possible, as calm as possible, with a way out when something is
stuck. Every message follows the four parts of `../ui-ux/references/helpful-feedback.md`: what
happened, why in plain words, what to do now, what is kept.

## Behaves

| Key | Rule | Trap |
|---|---|---|
| `page.loading` | Skeleton of the page, no spinner over the page; for long operations say what is being done in steps the user understands | Empty state flashes before the data |
| `page.error` | Message with reason in user language and "Reload" | Blank page |
| `page.noAccess` | Own page "No access" with the reason, a way back and who can grant access | Blank page or 404 |
| `page.hint` | Page hint at the top, dismissible, action "Show me how" | Hint returns after dismissing |
| `status.saving` | Small status in place ("Saving …" → "Saved 10:42") | Whole page locked |
| `status.success` | Inline or toast, not modal, disappears on its own | Success dialog with "OK" |
| `status.warning` | Inline at the object, with a way out | Warning without an action |
| `status.error` | Inline at the object, short title, detail with a way out; input stays | "An error has occurred" |
| `status.live` | Others change the same record → data reloads quietly, hint only if it affects the user | Page jumps under the cursor |
| `status.stale` | Shown state is old → hint + "Reload" | Silently working on an old state |
| `status.conflict` | Show field by field what changed; never overwrite silently | Last write wins |
| `status.offline` | Say what stays local and when it will be transferred; retry automatically | Data gone |
| `status.tag` | Status as a tag with text, colour only in addition | Colour alone |

**Which form?** At the object (field, row, area) before page hint before toast. Modal only when the
user must decide (`ui-ux-dialog`). A hint that blocks an action is `action.blocked` (`ui-ux-active`).

## Accessibility

- Messages in a live region: `polite` for status and success, `assertive` only for errors that
  require immediate action. The region exists before the text.
- Messages never take focus (no alert dialogs for hints).
- Self-dismissing messages: at least 10 s, pause on hover/focus, closable; errors never disappear by
  themselves.
- Announce loading ("Loading") and set `aria-busy` on the area.
- Motion respects "reduced motion".

## Responsive

- Toasts full width at 375 px, never covering a primary action.
- Page hint wraps, buttons stacked; the skeleton has the shape of the narrow view.

## Common mistakes

- Spinner over the whole page; toast for a field error.
- Message that steals focus.
- Error without a way out, success without content.
- Copy that blames the user, alarms without need ("Fatal", "!") or only names a code.
- Realtime update that overwrites input.

## Checklist

- [ ] Loading, error, no access defined per page?
- [ ] Message at the object, with a way out, without stealing focus?
- [ ] Live region with fitting urgency?
- [ ] Stale and conflict visible instead of silent?
- [ ] Time limits ≥ 10 s and closable?
- [ ] Every message: what happened, why, what now, what is kept; calm tone, no blame?

Heuristics (`../ui-ux/references/masters.md`): H1 system status, H7 dismissible page hints that stay dismissed, H9 notice with a way out.

Implementation: mapping of the keys in the design-system mapping (`ui-ux/references/design-system-mapping.md`).
