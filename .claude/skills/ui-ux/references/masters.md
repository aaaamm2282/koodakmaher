# Principles of the masters

What the suite takes from the classics and from research on feedback. Each rule has a check question and a case. Applies to all
sub-skills; name the term in findings so it can be looked up.

## Read the originals

- Don Norman: [The Design of Everyday Things](https://www.nngroup.com/books/design-everyday-things-revised/)
  (revised edition 2013), [Signifiers, not affordances](https://jnd.org/signifiers-not-affordances/),
  [Affordances and design](https://jnd.org/affordances-and-design/),
  [The Two UX Gulfs](https://www.nngroup.com/articles/two-ux-gulfs-evaluation-execution/),
  [Mapping](https://www.interaction-design.org/literature/topics/mapping)
- Jakob Nielsen: [10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
  (1994, revised 2020, last reviewed 30 Jan 2024),
  [Consistency and Standards](https://www.nngroup.com/articles/consistency-and-standards/),
  [Aesthetic and Minimalist Design](https://www.nngroup.com/articles/aesthetic-minimalist-design/),
  [Toggle-Switch Guidelines](https://www.nngroup.com/articles/toggle-switch-guidelines/),
  [How to Conduct a Heuristic Evaluation](https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/),
  [Cognitive Walkthrough Workshop](https://www.nngroup.com/articles/cognitive-walkthrough-workshop/)
  (method in `cognitive-walkthrough.md`)
- Gestalt: [Principles of grouping](https://en.wikipedia.org/wiki/Principles_of_grouping),
  [Proximity](https://www.nngroup.com/articles/gestalt-proximity/),
  [Similarity](https://www.nngroup.com/articles/gestalt-similarity/),
  [Principles of Visual Design](https://www.nngroup.com/articles/principles-visual-design/),
  [Cumulative Layout Shift](https://web.dev/articles/cls)
- UX writing: Ginny Redish, [Letting Go of the Words](https://shop.elsevier.com/books/letting-go-of-the-words/redish/978-0-12-385930-3),
  [Writing for GOV.UK](https://www.gov.uk/guidance/content-design/writing-for-gov-uk),
  [How Users Read on the Web](https://www.nngroup.com/articles/how-users-read-on-the-web/),
  [UI Copy](https://www.nngroup.com/articles/ui-copy/)

## 1. Interaction (Norman)

| Term | Meaning | Check question |
|---|---|---|
| **Signifier** (affordance) | The element shows that and how it can be used | Does it invite use, and only when it actually does something? |
| **Mapping** | Control and effect belong together spatially | Is the effect visible where the user acted? |
| **Feedback** | Every action gets an immediate visible answer | What has visibly changed after the click? |
| **Gulf of execution** | Gap between "I want to" and "I know how" | Can the action be found without help? |
| **Gulf of evaluation** | Gap between "I did it" and "I see what happened" | Is the new state recognisable without thinking? |
| **Conceptual model** | The picture in the user's head of how the system works | Does what happens match what the label promises? |
| **Constraints** | Wrong input is impossible in the first place | Can the mistake be made, instead of being reported afterwards? |

**Basement switch.** A switch whose effect happens elsewhere is like a light switch in the basement
that turns on the attic light: it invites flipping, and then one wonders what happened. If a setting
acts outside the page, the label names the place ("Show in lists") and the help text says where the
effect can be seen, ideally with a link there. Case: a settings toggle "Show examples" that only
changes lists on other pages.

## 2. Heuristics (Nielsen)

Name the number in findings ("H5"). Cases are generic building blocks; map them to your design system.

| # | Heuristic | Check question | Building block | Applied in |
|---|---|---|---|---|
| H1 | Visibility of system status | Is it obvious at once whether it is loading, saved or failed? | Save-status line with live region, skeleton while loading | `ui-ux-passive`, `ui-ux-chart` (as-of time), walkthrough Q4 |
| H2 | Match between system and real world | Are the words the users' own, in the order of their paper work? | Domain terms in labels, verb + noun on buttons, no internal names | Entry skill "Language", `ui-ux-form`, `ui-ux-chart`, walkthrough Q1/Q3 |
| H3 | User control and freedom | Is there a clear exit, and can what was done be taken back? | Leave guard for unsaved changes, Escape and Cancel in dialogs, undo or trash | `ui-ux-active`, `ui-ux-dialog`, `ui-ux-tabs` |
| H4 | **Consistency and standards** | Does the same look the same, sit in the same place and follow convention? | Design-system components and tokens only, stable frame (below), audit ratchet in the gate | Design-system mapping, `ui-ux-tabs`, `/ui-ux-behaves:audit`, walkthrough Q3 |
| H5 | Error prevention | Can the costly error not happen at all, or is the consequence known beforehand? | Constraints, pickers instead of free text, confirmation naming object and consequence | `ui-ux-form`, `ui-ux-date`, `ui-ux-active`, `ui-ux-dialog` |
| H6 | Recognition rather than recall | Is everything needed visible without remembering it? | Visible filters, combo box, help link in context | `ui-ux-table`, `ui-ux-form`, `ui-ux-date`, `ui-ux-tabs`, walkthrough Q2 |
| H7 | Flexibility and efficiency of use | Do experts have shortcuts, and does the app remember habits? | Keyboard shortcuts, remembered filters and column layout, dismissible hints | `ui-ux-table`, `ui-ux-passive` (`page.hint`), entry skill "Help" |
| H8 | **Aesthetic and minimalist design** | Does every word and element earn its place for the main goal? | No stutter (same word twice), dismissible page hints | Group 4 below, `/ui-ux-behaves:copy-check`, `ui-ux-chart`, walkthrough Q2 |
| H9 | Recognise, diagnose, recover from errors | Does the message name the problem in plain words and offer the way out? | Notice with a next step (button or link) instead of code or dead end (`helpful-feedback.md`, `warn-but-recover.md`) | `ui-ux-form`, `ui-ux-passive`, `ui-ux-active`, walkthrough Q4 |
| H10 | Help and documentation | Is help in context, searchable and made of concrete steps? | Help page per flow, context link from the page, searchable help | Entry skill "Help", `ui-ux-form` (`field.repeatedError`), walkthrough |

Every heuristic has at least one place where it is applied. A review answers all ten, each with a
finding or "no finding"; none is skipped because it seems not to fit.

**Stable frame** (heuristic 4). Header, menu and side navigation stay in place when the user switches
a tab or opens a page. If the frame disappears on one page, space appears that was not there before.
It works like contrast: the eye jumps there and looks for a meaning that does not exist. Check
question: is the frame the same on every tab? Case: one tab of a settings page suddenly showing no
menu.

## 3. Perception (Gestalt)

| Law | Meaning | Check question |
|---|---|---|
| **Proximity** | What is close together belongs together | Do the spacing steps (tokens) reflect what belongs together? |
| **Similarity** | What looks alike seems alike | Do alike things look alike and different things different? |
| **Figure and ground** | White space is not a remainder, it shapes the figure | Is the white space intended, or did something drop out? |
| **Closure / common region** | Containers hold groups | Is the border needed, or does spacing suffice? |
| **Contrast** | Difference draws the eye | Does the strongest contrast point to the most important thing? |

White space belongs to the layout like text. It must not change between states of the same page
unless the user wants it (panel closed, full screen). See also: no layout shift (`ui-ux-date`).

## 4. Language (UX writing, content design)

- **No stuttering.** The same word not twice in close proximity. The heading carries the term; the
  elements below only say what they do. Instead of "Examples" / "Show examples" / "Examples are …" /
  "Open my examples": "Examples" / "Show in lists" / "Made-up cases for practice …" / "Open mine".
- **Effect before object.** A label says what happens and where, not only what it is about.
- **Important first.** The first two words carry the meaning; people read beginnings, not sentences.
- **Leave out.** What the heading, the place or the element already says is not repeated
  (heuristic 8).
- **Read aloud.** If the block sounds bumpy when read aloud, rewrite it. Screen readers read exactly
  like that.

## 5. Sound

People ask for a sound when feedback is missing (the basement switch). The fix is visible feedback
at the place of the action, not a sound.

- **No sound on ordinary controls.** Toggles, buttons and saves stay silent; the visible change is
  the feedback (Norman: feedback, mapping).
- **Sound only as a supplement, never as the only signal.** Whoever cannot hear it, has it switched
  off or works in a shared room must get the same information on screen (WCAG 1.3.3, 1.4.2).
- **Off by default, switchable per user.** If at all, for rare events that happen while the user
  looks elsewhere: a reminder that is due, a message that arrived.
- **Mind the room.** In counselling and other confidential settings a sound tells everyone at the
  desk that something happened. Silence is the safe default.
- **Screen readers already speak.** Live regions (`role="status"`) are the audible feedback for
  those who need it; do not add a second sound on top.

Check question: does the screen say the same as the sound would? Case: a user wishing a toggle
"made a sound" because its effect was on another page.

Read: [WCAG 1.4.2 Audio Control](https://www.w3.org/WAI/WCAG22/Understanding/audio-control),
[WCAG 1.3.3 Sensory Characteristics](https://www.w3.org/WAI/WCAG22/Understanding/sensory-characteristics),
[Audio Signifiers for Voice Interaction (NN/g)](https://www.nngroup.com/articles/audio-signifiers-voice-interaction/).

## 6. Respect (no deceptive patterns)

Everything above comes from research about how people perceive, read and decide. The same
knowledge can be turned against them: to make them click, stay, pay or share more than they want.
This suite uses it only for the people on the screen.

| Never | Instead |
|---|---|
| **False urgency** ("Only 2 left", countdowns that restart) | State real deadlines with their source |
| **Confirmshaming** ("No, I don't care about my safety") | A neutral "No" next to the "Yes" |
| **Hidden costs or steps** that appear only at the end | All costs and steps visible from the start |
| **Harder out than in** (sign up in one click, cancel by phone) | Leaving takes as few steps as joining |
| **Pre-ticked consent** and sharing switched on by default | Off by default; the person switches it on |
| **Nagging** (the same request after every "No") | Ask once; respect the answer for a stated time |
| **Disguised ads or actions** (an ad that looks like a result, "Continue" that subscribes) | Label what it is; the button says what happens |

Check question: would the person agree if they saw exactly how the screen works on them?
Case: a cancel button that is grey and small while "Keep my plan" is large and coloured.

Read: Harry Brignull, [Deceptive Patterns](https://www.deceptive.design/),
[Deceptive Patterns in UX (NN/g)](https://www.nngroup.com/articles/deceptive-patterns/),
EU Digital Services Act, [Article 25](https://eur-lex.europa.eu/eli/reg/2022/2065/oj) (ban on
deceptive interface design for online platforms).

## 7. Helpful feedback (nobody is left stranded)

Every message answers the next question before it is asked: what happened, why in plain words,
what to do now, what is kept. Every warning, error and block offers an action that moves the
person forward; help grows with the difficulty, up to a person to ask. The tone describes the
situation, not the person, and states high standards with confidence that they can be met.

Check question: after reading the message once, does the person know what to do next, and does
it sound like a calm colleague? Case: "Invalid input" under a date field instead of "Enter a date
after 1 March, for example 15.03.2026".

Pattern, help ladder, examples and the research it rests on (Stanford: Yeager and Cohen on wise
feedback, Nass on computers as social actors, Fogg on ability and prompts; Harvard: Mullainathan on
scarcity, Buell and Norton on operational transparency, Amabile on small wins, Edmondson on
psychological safety): `helpful-feedback.md`.

## During a review

1. Look at the page once like a newcomer: what invites a click, and what is different afterwards?
2. Go through the seven groups above and name findings with the term
   ("Mapping: toggle acts on another page"); in group 2 answer H1 to H10 one by one.
3. Severity and fix as in the entry skill under "Depth of method".
4. For a core or costly task, follow it step by step as well: `cognitive-walkthrough.md`.
