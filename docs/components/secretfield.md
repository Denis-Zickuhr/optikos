# SecretField  (type: 'secretfield')
Purpose:       A field for secrets (API key, token, integration password): whoever **types** can see what they typed; a secret that is **already saved is never shown again**: to change it, it has to be replaced, after a warning.
Anatomy:       Like `TextField` (`op-textfield`) + `op-secret`: a `type=password` input, an **eye** button (`__eye`, only while typing), and in the saved state the **Replace** (`__replace`) / **Keep current** (`__keep`) buttons and the hint "a value is saved and it cannot be shown".
Value:         `getValue()`: `null` = untouched (keep what is saved), `'text'` = a new value, `''` = replaced and left empty (clear it). Only the last two should be sent to the server. `isStored()` says whether a secret is saved; `isReplacing()` whether the user is changing it.
Config:        (TextField) + `stored: false` (a secret is already saved; `form.load({ apiKey: true })` also turns it on), `confirmReplace: true` (a modal warning before replacing),
               `replaceTitle`, `replaceText` (the warning text), `autoHide: true` (the eye hides again when leaving the field). `inputType` is always password (the eye switches it to text).
API:           `setStored(bool)`, `isStored()`, `isReplacing()`, `replace()` (opens the warning; returns Promise<boolean>), `keep()` (gives up the change and goes back to the saved state), `setRevealed(bool)`, `isRevealed()`, `getDisplayText()` (never reveals: `••••••••` or empty).
Events:        `before-replace` (cancelable), `replace` (after confirming), `keep`, `stored-change(bool)`, `change`.
States:        `is-stored` (read-only, a mask instead of the value, no eye), `is-replacing`, `is-revealed`. `required` counts as met while there is an untouched saved secret.
Flow:          Create: type (masked), the eye shows/hides. Edit with a saved secret: the field shows `••••••••` and reveals nothing; clicking the field or **Replace** opens the warning ("the saved value cannot be shown and will be discarded..."); after confirming, the field empties and becomes a normal typing field (with the eye) and **Keep current** appears.
               `reset()` goes back to the saved state. The text never reaches `getDisplayText`, StepForm summaries or Optikos logs.
Keyboard/ARIA: The eye is a button with `aria-pressed` and the label "Show/Hide value"; in the saved state the input is `readonly` and described by the hint (`aria-describedby`); Enter/Space in the input or on Replace open the warning; the warning is a modal `MessageBox` (trapped focus, Esc cancels).
Tokens:        those of `TextField`; `--op-secret-mask-fg` (color of the saved-state mask).
Sandbox cases: `form`: create vs edit, replace warning, "keep current", `required`, loading with `{ key: true }`.
Out of scope:  copy to the clipboard, generating secrets, a strength meter, showing the last 4 characters (the server decides what to send back).
