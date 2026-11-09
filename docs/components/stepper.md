# Stepper  (type: 'stepper')
Purpose:       Shows the steps of a process (sign-up, checkout, import): where I am, what is done, what failed. The base of `StepForm`.
Anatomy:       `ol.op-stepper` > `li.op-stepper__step` (`is-current`, `is-done`, `is-error`, `is-optional`) > `button.op-stepper__btn` > `__marker` (number, ✓ or !) + `__text` (`__title`, `__desc`, "optional"); the line between steps is the item's `::after`.
Config:        `steps: [{ id?, title, description?, icon?, optional? }]`, `active: 0`, `clickable: true` (clicking a step), `ariaLabel`.
API:           `setActive(i)`, `getActive()`, `setStepState(i, 'pending'|'done'|'error')`, `getStepState(i)`, `setSteps(list)`.
Events:        `before-select(i)` (cancelable: the owner decides whether it can go there), `select(i)` (after `setActive`). Without a listener, a click just changes the step.
States:        per step: `current`, `done`, `error`, `pending`; `optional` shows "optional".
Keyboard/ARIA: An `<ol>` with `aria-label`; the current step has `aria-current="step"`; each step is a button (Tab/Enter/Space), disabled when `clickable: false`; the error/done state is said in hidden text ("done", "has errors").
               On phones only the current step shows its words; the others keep them visually hidden, so every button keeps its name.
Tokens:        `--op-stepper-marker-size`, `--op-stepper-line`, `--op-stepper-done-bg`, `--op-stepper-current-bg`, `--op-stepper-error-bg`.
Sandbox cases: `navigation` (standalone, with states) and `form` (inside StepForm).
Out of scope:  vertical orientation, branching steps.
