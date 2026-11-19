# Behave catalog

All states of the suite. Key `context.state[.severity]`. Every key appears exactly once here and
exactly once in your design-system mapping (`design-system-mapping.md`, check below).
Columns: phase · semantics · trigger · sub-skill.

Overlaps: `action.*` says **what** is decided (consequence, way back); `dialog.*` says **how** the
dialog behaves (focus, closing). A delete confirmation satisfies both. `form.submitFailed` applies to
the form, `status.offline` additionally when the connection is gone altogether. `form.submitSuccess`
follows the rules of `action.success`.

<!-- behave-keys:start -->
| Key | Phase | Semantics | Trigger | Skill |
|---|---|---|---|---|
| `page.loading` | processing | progress | on-async | ui-ux-passive |
| `page.error` | outcome | error | on-async | ui-ux-passive |
| `page.noAccess` | outcome | blocked | on-async | ui-ux-passive |
| `page.hint` | idle | info | timed | ui-ux-passive |
| `status.saving` | processing | progress | on-async | ui-ux-passive |
| `status.success` | done | success | on-async | ui-ux-passive |
| `status.warning` | outcome | warning | on-async | ui-ux-passive |
| `status.error` | outcome | error | on-async | ui-ux-passive |
| `status.live` | outcome | info | on-async | ui-ux-passive |
| `status.stale` | outcome | warning | on-async | ui-ux-passive |
| `status.conflict` | outcome | warning | on-submit | ui-ux-passive |
| `status.offline` | outcome | error | on-async | ui-ux-passive |
| `status.tag` | idle | info | — | ui-ux-passive |
| `field.focus` | interact | — | on-focus | ui-ux-form |
| `field.validating` | processing | progress | on-async | ui-ux-form |
| `field.valid` | outcome | success | on-blur | ui-ux-form |
| `field.invalid` | outcome | error | on-blur | ui-ux-form |
| `field.warning` | outcome | warning | on-blur | ui-ux-form |
| `field.optional` | idle | info | — | ui-ux-form |
| `field.readonly` | idle | blocked | — | ui-ux-form |
| `field.disabled` | idle | blocked | — | ui-ux-form |
| `field.override` | recovery | warning | on-blur | ui-ux-form |
| `field.repeatedError` | recovery | error | on-submit | ui-ux-form |
| `form.dirty` | interact | warning | on-input | ui-ux-form |
| `form.dirtyGuard` | outcome | warning | on-leave | ui-ux-form |
| `form.submitting` | processing | progress | on-submit | ui-ux-form |
| `form.submitSuccess` | done | success | on-submit | ui-ux-form |
| `form.submitFailed` | recovery | error | on-submit | ui-ux-form |
| `form.errorSummary` | outcome | error | on-submit | ui-ux-form |
| `form.autosave` | processing | progress | timed | ui-ux-form |
| `date.single` | interact | — | on-input | ui-ux-date |
| `date.dateTime` | interact | — | on-input | ui-ux-date |
| `date.range` | interact | — | on-input | ui-ux-date |
| `date.relative` | interact | — | on-input | ui-ux-date |
| `date.preset` | interact | — | on-input | ui-ux-date |
| `date.unavailable` | idle | blocked | — | ui-ux-date |
| `date.invalid` | outcome | error | on-blur | ui-ux-date |
| `table.loading` | processing | progress | on-async | ui-ux-table |
| `table.empty` | outcome | empty | on-async | ui-ux-table |
| `table.noResults` | outcome | empty | on-input | ui-ux-table |
| `table.loadError` | recovery | error | on-async | ui-ux-table |
| `table.sorted` | interact | info | on-input | ui-ux-table |
| `table.filtered` | interact | info | on-input | ui-ux-table |
| `table.selected` | interact | info | on-input | ui-ux-table |
| `table.bulkActions` | interact | — | on-input | ui-ux-table |
| `table.rowActions` | interact | — | on-focus | ui-ux-table |
| `table.inlineEdit` | interact | — | on-input | ui-ux-table |
| `cell.invalid` | outcome | error | on-blur | ui-ux-table |
| `table.expanded` | interact | info | on-input | ui-ux-table |
| `table.scale` | idle | info | — | ui-ux-table |
| `table.density` | idle | — | on-input | ui-ux-table |
| `table.columns` | idle | — | on-input | ui-ux-table |
| `action.primary` | idle | — | — | ui-ux-active |
| `action.secondary` | idle | — | — | ui-ux-active |
| `action.danger` | idle | warning | — | ui-ux-active |
| `action.hidden` | idle | blocked | — | ui-ux-active |
| `action.blocked` | idle | blocked | — | ui-ux-active |
| `action.pending` | processing | progress | on-submit | ui-ux-active |
| `action.warn` | idle | warning | before-action | ui-ux-active |
| `action.notice` | idle | info | before-action | ui-ux-active |
| `action.confirm` | processing | warning | on-submit | ui-ux-active |
| `action.confirmTyped` | processing | warning | on-submit | ui-ux-active |
| `action.success` | done | success | on-submit | ui-ux-active |
| `action.undo` | recovery | success | on-submit | ui-ux-active |
| `action.deactivate` | recovery | info | on-submit | ui-ux-active |
| `action.failed` | recovery | error | on-submit | ui-ux-active |
| `tab.selected` | interact | — | on-input | ui-ux-tabs |
| `tab.route` | interact | — | on-input | ui-ux-tabs |
| `tab.dirty` | interact | warning | on-input | ui-ux-tabs |
| `tab.invalid` | outcome | error | on-submit | ui-ux-tabs |
| `tab.overflow` | idle | — | — | ui-ux-tabs |
| `tab.disabled` | idle | blocked | — | ui-ux-tabs |
| `dialog.open` | interact | — | on-input | ui-ux-dialog |
| `dialog.form` | interact | — | on-input | ui-ux-dialog |
| `dialog.confirm` | processing | warning | on-submit | ui-ux-dialog |
| `dialog.busy` | processing | progress | on-submit | ui-ux-dialog |
| `dialog.error` | recovery | error | on-submit | ui-ux-dialog |
| `dialog.nested` | interact | warning | on-input | ui-ux-dialog |
| `dialog.close` | done | — | on-input | ui-ux-dialog |
| `dialog.sidePanel` | interact | — | on-input | ui-ux-dialog |
| `chart.loading` | processing | progress | on-async | ui-ux-chart |
| `chart.empty` | outcome | empty | on-async | ui-ux-chart |
| `chart.error` | recovery | error | on-async | ui-ux-chart |
| `chart.axis` | idle | info | — | ui-ux-chart |
| `chart.legend` | interact | info | on-input | ui-ux-chart |
| `chart.tooltip` | interact | info | on-focus | ui-ux-chart |
| `chart.color` | idle | info | — | ui-ux-chart |
| `chart.table` | idle | info | on-input | ui-ux-chart |
| `chart.kpi` | idle | info | on-async | ui-ux-chart |
| `chart.dashboard` | idle | info | — | ui-ux-chart |
<!-- behave-keys:end -->

## Warn, but Recover in the grid

| Step | Key | Phase · semantics |
|---|---|---|
| early warning | `action.warn` | idle · warning |
| notice | `action.notice` | idle · info |
| escalated warning | `action.warn` in a dialog | processing · warning |
| question | `action.confirm` / `action.confirmTyped` | processing · warning |
| success | `action.success` + `action.undo` | done/recovery · success |

## Check the mapping

```bash
keys() { sed -n '/behave-keys:start/,/behave-keys:end/p' "$1" | grep -o '^| `[a-zA-Z.]*`' | sort; }
diff <(keys behave-catalog.md) <(keys path/to/your-design-system/design-system-mapping.md)
```
No difference = the design system maps every state exactly once.
