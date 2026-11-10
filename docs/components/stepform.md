# StepForm  (type: 'stepform')
Purpose:       A long form guided by steps (details → address → contact → review), with validation per step and a final summary. It is **one** form: `getValues`, `load`, `dirty`, `reset` cover every step.
Anatomy:       `form.op-form.op-stepform` > `Stepper` (top) + body (`card` layout, one step visible at a time, `.op-stepform__step`) + footer (`Cancel` · Back · Next · Finish).
Config:        (Form) + `steps: [{ title, description?, icon?, optional?, items, layout?, validate? }]` (default step layout: a 2-column grid, 1 on phones;
               `validate(values, form, signal)` is a step check that may ask the server and returns, or resolves with, `true`, a message for the step or `{ field: message }`),
               `linear: true` (no moving ahead without validating the steps on the way; `false` lets the user click any step), `review: false | true | (values, form) => string | Node`
               (adds a "Review" step summarizing the values; the function replaces the default summary), `reviewTitle`, `backText`, `nextText`, `finishText`, `cancelText` (shows the Cancel button).
API:           (Form) + `next()`, `back()`, `goTo(i)` (each resolves with whether it moved; at once when no step `validate` is on the way), `getStep()`, `getStepCount()`, `validateStep(i)`, `getStepper()`.
Events:        `before-step-change(from, to)` (cancelable), `step-change(to, from)`, `finish(values)` (only after every step validates), `cancel`, and the Form ones (`submit`, `invalid`...).
Flow:          Next only moves on if the current step's fields validate (the 1st invalid one gets the focus and the step shows an error); Back always goes back and keeps the values.
               Finish validates **every** step; if one fails, it goes there. Enter in a single-line field = Next (on the last step = Finish).
               With `linear: true`, clicking a step ahead validates the ones on the way and stops at the first invalid one.
               A step `validate` runs after its fields pass, when leaving it forward and again on Finish: Next and Finish show their loading state
               (`is-validating` on the form) and a second click does nothing; messages per field mark those fields, a string (or a thrown error) shows in
               an alert line above the step. Going back aborts it (the `signal`); with checks, Finish returns `false` and `finish` fires once they pass.
States:        Stepper steps: current, done (already validated), error (failed to validate). The review step is rebuilt every time it is entered.
Keyboard/ARIA: Enter moves on; the stepper has `aria-current="step"`; changing steps moves the focus to the new step's panel (`autoFocus: true`: to its first field, which pops up a phone keyboard); native buttons.
Tokens:        `--op-stepform-gap`, `--op-stepform-step-padding` (+ those of Stepper).
Sandbox cases: `form`: a 4-step sign-up with review, inside a modal `Window` and on the page, an optional step, non-linear mode, a step check against a (simulated) server.
Out of scope:  conditional/branching steps, saving a draft between steps (use `getValues`/`load`), async validators per field (use the step `validate`).
