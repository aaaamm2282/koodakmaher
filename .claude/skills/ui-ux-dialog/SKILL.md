---
name: ui-ux-dialog
description: Dialogs and side panels. Use when a modal, follow-up question, confirmation dialog, form in a dialog or side panel is planned or reviewed, when focus gets lost after closing, Escape or nested dialogs cause problems, or when deciding between a dialog and a separate page.
---

# Dialogs

Principle: a dialog **interrupts**. It is worth it only for a short, self-contained task or a
decision that has to be made now. Everything else stays on the page.

## When a dialog

| Situation | Pattern |
|---|---|
| Decision before a hard-to-reverse action | Confirmation (`dialog.confirm`, rules in `ui-ux-active`) |
| Short form (up to about 6 fields), context must stay visible | Dialog with form (`dialog.form`) |
| Look up details, keep working next to the list | Side panel (`dialog.sidePanel`) |
| Long form, tabs, several steps, sharing a link | Separate page |
| Information without a decision | Inline (`ui-ux-passive`), no dialog |

## Behaves

| Key | Rule | Trap |
|---|---|---|
| `dialog.open` | Initial focus: first field; for confirmations the **safe** action | Focus on "Delete" |
| `dialog.form` | Rules from `ui-ux-form`; primary button = verb + noun | "OK" |
| `dialog.confirm` | Title = question with the object, text = consequence with count/names, buttons "Delete record" / "Cancel" | "Are you sure?" + Yes/No |
| `dialog.busy` | Not closable during the action, button shows progress | Cancel still deletes |
| `dialog.error` | Error inside the dialog, dialog stays open, input stays | Dialog closes, error gone |
| `dialog.nested` | Follow-up from a dialog only for discard/delete; sits visibly on top | Second dialog underneath |
| `dialog.close` | Escape and Cancel close; focus back to the trigger or a neighbour | Focus at the top of the page |
| `dialog.sidePanel` | Not modal, page stays usable; closable via Escape | Panel covers the primary action |

Unsaved input in a dialog: closing asks (`form.dirtyGuard`). A click outside the dialog never closes
a form.

## Accessibility

- Role `dialog` (confirmation: `alertdialog`), name = title, description = consequence.
- Focus trapped inside the dialog, background inert; Escape closes.
- Focus set on opening and returned on closing; if the trigger has gone, to the neighbour or the
  menu.
- Errors inside the dialog are announced.

## Responsive

- At 375 px full width and height, buttons stacked, safe action reached first.
- Content scrolls inside the dialog, header and buttons stay; at 200 % zoom the buttons stay
  reachable.
- The side panel becomes full screen at 375 px.

## Common mistakes

- Dialog for pure information; dialog in a dialog in a dialog.
- Yes/No buttons; destructive action with initial focus.
- Focus lost after closing.
- Long form in a dialog instead of a separate page.

## Checklist

- [ ] Is a dialog the right pattern?
- [ ] Initial focus and focus return defined?
- [ ] Buttons verb + noun, safe action default?
- [ ] Errors stay in the dialog, input kept?
- [ ] 375 px and 200 % zoom checked?

Heuristics (`../ui-ux/references/masters.md`): H3 exit (Escape, Cancel), H5 confirm only when there is a consequence.

Implementation: mapping of the keys in the design-system mapping (`ui-ux/references/design-system-mapping.md`).
