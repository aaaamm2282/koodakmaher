# Warn, but Recover – in detail

For risky or hard-to-reverse actions: warn safely, do not punish, and end with a constructive close
instead of a dry "Are you sure?".

## Sequence and UX concepts

| State | Key | Concept | Function |
|---|---|---|---|
| `warnBehave` (1st) | `action.warn` | early hint, inline | consequence visible before the action happens |
| `notice` | `action.notice` | hint without breaking the flow | directs attention |
| `warnBehave` (2nd) | `action.warn` | escalated warning | friction grows with risk |
| `question` | `action.confirm` | confirmation in user language | explicit consent |
| `successBehave` | `action.success` + `action.undo` | close + way back | result, undo, next step |

The branch `warn → question` is triggered **only** when the action is serious and hard to reverse.
Routine goes straight to `successBehave`.

## Four strategies

- **Tiered confirmation:** routine → undo message; consequential → confirmation; catastrophic →
  additionally typing or re-authentication.
- **Forgiveness:** reversibility (undo, trash, deactivate), safety nets (confirmation, versions,
  autosave, audit log), friendly failure (action-oriented, without blame; `../../ui-ux/references/helpful-feedback.md`).
- **Peak-end rule:** people remember the peak and the end; so it ends with a helpful close.
- **Guide instead of forbid:** the safe choice as default, clear language, no manipulation.

## Decision tree (general)

1. Reversible? → execute + undo.
2. Can it be cushioned? → soft delete with retention, versions, autosave.
3. Would a mistake really hurt? → confirmation with specific text.
4. Frequent? → light; rare and severe → more friction.
5. User in flow? → not modal.
6. Worst case? → protect in several layers; for "slightly annoying", undo is enough.

Version with "deactivate instead of delete": `SKILL.md`.

## Designing `successBehave`

- Specific: "Message sent to Anna Weber. Undo?"
- Action buttons instead of yes/no: "Delete record" / "Cancel"; the dangerous action always carries
  verb + noun.
- Offer the next step: "Record restored – create letter".
- Undo large and reachable; the message does not disappear while focus or mouse is on it.
- On system error: "Your changes are saved locally and will be transferred on the next connection"
  + automatic retry, not "An error has occurred".
- Accessible: live region, focus into the dialog and back, longer time (≥ 10 s) for cognitive
  accessibility.

## Deliberate deviations from common advice

- **No "X" on the undo message?** Rejected: WCAG 2.2.1 requires control over time limits; closing
  stays possible, instead the message pauses on focus/hover.
- **Undo 5–7 s?** Too short for interrupted work; use ≥ 10 s, and the way back stays reachable
  afterwards via trash or audit log.

## Common mistakes

- Confirming every harmless action → dialog fatigue, blind "OK".
- "Yes/No" buttons → loss of context.
- Destructive action as default or on Enter.
- Offering "Undo" when it can fail.
- Showing the scope only after the confirmation.
- Error texts in technician tone.
- Artificial waiting time instead of a safety net (feels patronising).

## Measuring

Recovery rate (how often undo/trash is used) and abandonments after errors from usage logs.
Forgiveness retains users, not only usability.
