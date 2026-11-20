# Helpful feedback: nobody is left stranded

Every message the screen shows (hint, warning, error, block, empty state, success) answers the
person's next question before they have to ask it. A message is never a dead end: it explains what
happened in their words, says what they can do now, and points to help that fits this moment. The
tone is calm and kind, and it stays that way when the person made the mistake.

The suite treats this as a pattern that applies everywhere. The sub-skills say **where** a message
appears (`ui-ux-passive`, `ui-ux-form`, `ui-ux-active`); this file says **what every message must
carry** and **how it sounds**.

## The four parts of every message

| Part | Question it answers | Example |
|---|---|---|
| **What happened** | "What is going on?" | "The file could not be uploaded" |
| **Why, in plain words** | "Is it me, or the system?" | "It is larger than 10 MB" |
| **What to do now** | "How do I get on?" | Button "Choose a smaller file", link "How to make a PDF smaller" |
| **What is safe** | "Did I lose anything?" | "Your other entries are kept" |

Short messages may merge parts ("Enter a date after 1 March"), but none may be missing when the
person cannot go on. A message that only names the problem ("Invalid input", "Error 500",
"Not allowed") fails this check.

**Way out, always.** Every warning, error and block offers at least one action that moves the
person forward: fix it here, try again, choose another way, save for later, or ask a person. If the
system truly cannot help, it says who can and how to reach them, and keeps the input.

## Tone: soft, specific, solution first

- **No blame.** Describe the situation, not the person: "This date is in the past", not "You entered
  a wrong date". Passive or neutral wording is fine when the person caused it; "we" is fine when the
  system caused it ("We could not reach the server").
- **No alarm.** No capitals, exclamation marks, "Fatal", "Illegal", "Failed!" or red for things that
  are not urgent. Red and `assertive` announcements are kept for what really needs action now.
- **Solution before reason.** When space is short, the way out wins over the explanation: "Enter the
  amount in euros, for example 12.50" teaches more than "Wrong format".
- **High standards, stated with confidence.** When the screen asks for more (a missing document, a
  field that needs correcting), say why it matters and that it can be done: "A signed copy is
  needed so the request can be processed. You can upload a photo of it." Never imply the person is
  unable.
- **Honest.** No reassurance the system cannot keep ("Don't worry, nothing is lost" only when it is
  true). No false urgency (group 6 in `masters.md`).
- **The same voice everywhere.** A field hint, a toast and a help page sound like the same calm
  colleague.

## The help ladder

Help grows with the difficulty the person shows, from the least disruptive step up. Each step is
reachable from the place of the problem, not only from a help menu (H10).

1. **Prevent.** Constraints and good defaults so the problem cannot occur (H5).
2. **Explain in place.** Format, example or reason next to the field or action, visible before the
   mistake (H6).
3. **Guide on the first problem.** Message with the four parts above, at the object (`field.invalid`,
   `status.error`, `action.blocked`).
4. **More help on repetition.** The same problem a second or third time: show an example, a short
   step list, a "How it works" link to the exact help section (`field.repeatedError`).
5. **A person.** Where a task matters (money, deadlines, rights, health), a way to ask someone:
   contact, callback, chat, or "Save and ask later". The input travels with the request so the
   person does not have to explain twice.

A help page never excuses a screen that cannot be used without it (entry skill, "Help").

## Show progress, not only problems

- **Show the work.** During longer operations, say what the system is doing in steps the person
  understands ("Checking the entries … Creating the letter …"), not a bare spinner (H1). Never add
  artificial delay to look busy.
- **Mark small steps forward.** After each completed part of a long task, show what is done and what
  is left ("2 of 4 steps done"). A success message names the result and offers the next step
  (`action.success`).
- **End well.** A flow that went wrong still ends with a clear state and a way forward, not with the
  error (peak-end, `ui-ux-active/references/warn-but-recover.md`).

## Respect limited attention

People who use the screen under stress, time pressure or worry have less attention to spare than
the designers who built it. Design for that person:

- One problem, one message, one next step. List several errors in a summary with links
  (`form.errorSummary`), not as a wall of text.
- Keep input on every error, never make the person start again.
- Prefer defaults and pre-filled values over questions; ask only what the system cannot know.
- Offer to save and continue later, and remind at the time the person chose.

## Check questions

- Does every warning, error and block offer at least one action that moves the person forward?
- Can the person tell in one reading what happened, whether it was them or the system, and what is
  kept?
- Does the message describe the situation, not the person?
- Is there more help on the second or third identical problem than on the first?
- Is there a way to reach a person where the task matters, with the input carried along?
- Read aloud: does it sound like a calm colleague, not like a log file or a reprimand?

## Before and after (neutral examples)

| Before | After |
|---|---|
| "Invalid date" | "Enter a date after 1 March 2026, for example 15.03.2026" |
| "Upload failed" | "The file could not be uploaded because it is larger than 10 MB. Choose a smaller file or [make the PDF smaller](#). Your other entries are kept" |
| "Access denied" | "You can view this record but not change it. [Ask for edit rights](#) or [contact the team lead](#)" |
| "No results" | "No records match 'Weber' with the filter 'Closed'. [Clear the filter](#) or search all records" |
| "Error 500. Try again later." | "We could not save your changes just now. They are kept on this device and will be sent automatically. [Try now](#)" |
| "You forgot the signature!" | "A signed copy is needed so the request can be processed. You can upload a photo of it" |

## Research this rests on

These studies are not about interfaces. What the suite takes from them is an inference for screen
design, stated in the right-hand column; it is not a claim the authors made.

| Study | Finding | What the suite takes from it |
|---|---|---|
| Yeager, Purdie-Vaughns, Garcia, Apfel, Brzustoski, Master, Hessert, Williams, Cohen (2014), [Breaking the cycle of mistrust: Wise interventions to provide critical feedback across the racial divide](https://sparq.stanford.edu/solutions/wise-critiques-help-students-succeed), *Journal of Experimental Psychology: General* 143, 804–824 (Stanford SPARQ summary) | Critical feedback with a short note stating high standards and confidence that the student can meet them ("wise feedback") led more students to revise their work. Among African-American students, optional revisions rose from 27 % to 64 %; the effect was largest for students with low trust in school. | Criticism is accepted when it states why the standard matters and that the person can meet it. Messages that ask for a correction say why and how, and never imply inability. |
| Mani, Mullainathan, Shafir, Zhao (2013), [Poverty impedes cognitive function](https://warwick.ac.uk/fac/soc/economics/news/2013/9/poverty), *Science* 341(6149), 976–980 (Mullainathan then at Harvard; University of Warwick summary) | Financial worry takes up mental bandwidth: in the experiments it lowered performance on reasoning tests by about as much as a lost night of sleep. The authors recommend simpler forms, defaults and reminders. | People under pressure have less attention for the screen. One problem per message, kept input, defaults, reminders and a way to continue later. |
| Buell, Norton (2011), [The labor illusion: How operational transparency increases perceived value](https://pubsonline.informs.org/doi/10.1287/mnsc.1110.1376), *Management Science* 57(9), 1564–1579 (Harvard Business School) | When a service shows the work it is doing while people wait, they value it more, and in some conditions prefer a longer wait with visible work over an instant result. | Waiting is explained in understandable steps instead of a bare spinner. The suite uses this only for honest progress, never for artificial delay. |
| Amabile, Kramer (2011), [The power of small wins](https://hbr.org/2011/05/the-power-of-small-wins), *Harvard Business Review* 89(5), 70–80; book *The Progress Principle* (Harvard Business Review Press, 2011) | In about 12,000 daily diary entries from knowledge workers, making progress in meaningful work was the strongest driver of a good workday; setbacks weighed heavily. | Show what is done and what is left, name each completed step, end every flow with a result and a next step. |
| Edmondson (1999), [Psychological safety and learning behavior in work teams](https://dash.harvard.edu/entities/publication/13a7b031-0fdd-45ec-a7e0-2b80e2bc679f), *Administrative Science Quarterly* 44(2), 350–383 (Harvard) | In 51 teams, a shared belief that it is safe to take interpersonal risks went with more learning behaviour (asking for help, discussing errors), which in turn went with performance. | Asking for help and admitting a mistake must feel safe on screen as well: no blame in copy, help that is easy to reach, errors that can be undone. |
| Nass, Steuer, Tauber (1994), [Computers are social actors](https://dblp.org/rec/conf/chi/NassST94), *Proceedings of CHI '94*, 72–78 (Stanford) | People apply social rules such as politeness and reactions to praise and criticism to computers, even when they know it is a machine. | Interface messages are heard like a person speaking. Blaming or cold copy hurts the way it would from a colleague, so the same courtesy applies. |
| Fogg (2009), [A behavior model for persuasive design](https://doi.org/10.1145/1541948.1541999), *Proceedings of Persuasive '09* (Stanford Behavior Design Lab, [model overview](https://behaviordesign.stanford.edu/resources/fogg-behavior-model)) | A behaviour happens when motivation, ability and a prompt come together; making the step easier is often more effective than raising motivation. | Every message carries the prompt and makes the next step as easy as possible: a button that does it, not an instruction to go somewhere else. The suite uses this for the person's own goals only (group 6 in `masters.md`). |

Where these sources are summaries (Stanford SPARQ, University of Warwick), the original papers are
cited in the first column. Studies with students, workers or shoppers do not prove the same effect
size on a screen; test copy changes with real users where the task matters.
