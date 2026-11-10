# MessageBox  (function; uses Window)
Purpose:       Ready-made `alert`, `confirm` and `prompt` dialogs based on Promises.
API:           `MessageBox.alert(text, {title, okText, icon}) → Promise<void>`;
               `MessageBox.confirm(text, {title, okText, cancelText, danger}) → Promise<boolean>`;
               `MessageBox.prompt(text, {title, value, placeholder, validators, autoFocus}) → Promise<string|null>` (`autoFocus: true` focuses the text field; by default the dialog gets the focus, so a phone keyboard does not pop up);
               `MessageBox.show({text, title, icon, buttons: [{id, text, variant}], cancelId})` for custom buttons → Promise<string> (the button id).
Anatomy:       A small modal Window: icon + text + (a TextField in prompt) + buttons in the footer. It does not dim the page (a modal `mask: false` Window: the page is inert and takes no clicks, but stays as it is); every call takes `mask: true` to dim it.
Keyboard/ARIA: `role=alertdialog`; initial focus on the primary button (or on the prompt field); Enter confirms, Esc cancels (resolves false/null);
               the text becomes `aria-describedby`.
Tokens:        uses those of Window/Button.
Sandbox cases: alert, confirm, dangerous confirm, prompt with validation, custom buttons, stacked over another Window.
Out of scope:  HTML in the text (text only), a progress bar, long texts with custom scrolling.
