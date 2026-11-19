# Cognitive walkthrough

A task-by-task inspection of **learnability**: could a person who has never seen the screen finish
a real task on their first try? No users take part, so it is cheap; a small group of reviewers
steps through the task from a newcomer's point of view and decides, step by step, whether that
person would succeed and why.

Use it for core tasks and for tasks where a mistake is costly (money, deadlines, personal data,
anything that cannot be taken back). It complements the heuristic review (`masters.md`, group 2):
the heuristics look at the whole screen, the walkthrough follows one path through it.

Source: Kim Flaherty, [Cognitive Walkthrough Workshop](https://www.nngroup.com/articles/cognitive-walkthrough-workshop/)
(NN/g, 2022) and [Evaluate Interface Learnability with Cognitive Walkthroughs](https://www.nngroup.com/articles/cognitive-walkthroughs/);
the method goes back to Wharton, Rieman, Lewis and Polson,
[The cognitive walkthrough method: a practitioner's guide](https://dl.acm.org/doi/book/10.5555/189200) (1994).
NN/g offers a printable template and a form version in the article.

## Prepare (before anyone sits down)

Answer four questions in writing:

1. **Whose eyes?** One user group per walkthrough, described from evidence (see "Who uses the app"
   in the entry skill): role, setting, what they already know from paper, other tools or the law.
   No invented personas; an assumption is marked as one.
2. **Which task?** One task the product supports, named as the user would say it
   ("Record a payment for an invoice"), not as a feature.
3. **Which steps?** The correct sequence of actions, written down in advance, plus known
   alternative paths. A form filled in and then "Next" may count as one step. Deciding this
   beforehand keeps the session from turning into a debate about the right way.
4. **Which version?** Paper sketch, clickable prototype or the running app. The fidelity limits
   what can be judged: a sketch says nothing about colour, contrast or real copy.

Bring: the screens or a way to show them, the step list, the user description, one recording sheet
per step (below).

## Roles

2–6 evaluators with different views: someone who knows the product, someone with UX or
cognitive-science background, the people who build it (they gain ownership of the result), and a
domain expert. Within the group:

| Role | Does |
|---|---|
| **Facilitator** | Briefs the group, keeps time and the ground rules |
| **Presenter** | Shows the screens and clicks as the group decides the user would |
| **Recorder** | Fills in one sheet per step and writes the summary |
| **Evaluators** | Everyone, the three roles above included |

## Ground rules

- Talk about how the user would react to what exists, **not** about redesign. Fixes come later.
- Nobody defends or explains why the design is as it is; the user cannot hear that explanation.
- Laptops closed, phones away.

## Run the session

1. Brief: purpose, user group, task, roles, rules.
2. Talk through the user group: what do they know when they arrive, which words do they use?
3. Name the task and show the step list.
4. For every step, ask the four questions, in this order:

| # | Question (paraphrased) | When the answer is "no", usually | Look up |
|---|---|---|---|
| Q1 | Will the user **try to do the right thing** here? | The goal of this step is not the user's goal; the product's model is not theirs | Conceptual model, H2 |
| Q2 | Will the user **notice** that the right control is there? | Hidden, below the fold, in a menu, looks like decoration | Signifier, H6, H8 |
| Q3 | Will the user **connect** that control with what they want? | Label in system words, icon without text, effect happens elsewhere | Mapping, gulf of execution, H2, H4 |
| Q4 | After acting, will the user **see progress** toward the goal? | No visible change, change elsewhere, silent failure | Feedback, gulf of evaluation, H1, H9 |

5. A step **passes only if all four answers are "yes"**. For every "yes" note the reason (they know
   it from paper work, the screen says so, it is the convention); for every "no" write why.
6. When a step fails, record it and **go on as if it had worked**, so the following steps can still
   be judged.
7. Repeat for every step. Two full tasks fit into about 90 minutes.

## Recording sheet (one per step)

```markdown
Task: Record a payment for an invoice   User group: clerk, part-time   Step 3 of 6
Action: Choose "Add payment" in the invoice's row

| Q | Yes/No | Why |
|---|---|---|
| Q1 right thing | Yes | Payments are booked per invoice on the paper sheet too |
| Q2 notice | No | Action only in the overflow menu of the row, not visible |
| Q3 connect | Yes | "Add payment" uses their word |
| Q4 progress | Yes | New row appears, total updates in place |

Result: FAIL (Q2)
```

## Afterwards

- The recorder collects the sheets. Every failed question becomes a finding in the review format of
  the suite: severity, principle by name ("Signifier: row action hidden in overflow menu"), place,
  fix, and an acceptance criterion ("Given an invoice row, the action 'Add payment' is visible
  without opening a menu").
- Severity: a failure on a step without an alternative path, or on a costly step, is at least
  high; a failure with a visible alternative is medium.
- Track the findings where the team tracks work. Re-walk the task after the fix.

## Alone, or with Claude

The method is built for a group, but one reviewer can do it, and Claude can run it on screenshots,
an aria snapshot or the running app (`/ui-ux-behaves:walkthrough`). Then Claude takes all roles,
says which user description and step list it used and where they came from, and marks every answer
it could not judge from the material ("Q4 not judgeable: no screenshot after the click"). A solo or
Claude walkthrough prepares the group session; it does not replace it, and neither replaces testing
with real users.
