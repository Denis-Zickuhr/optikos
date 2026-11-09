# TextArea  (type: 'textarea')
Purpose:       Multi-line text.
Anatomy:       TextField with a `<textarea class="op-textfield__input op-textarea__input">`.
Config:        (TextField) + `rows: 3`, `autoGrow: false`, `maxRows`.
API/Events:    As TextField; Enter inserts a line break (it does not fire `enter` nor submit the Form; Ctrl+Enter fires `enter`).
Keyboard/ARIA: native `<textarea>`; implicit `aria-multiline`.
Tokens:        those of TextField + `--op-textarea-min-height`.
Sandbox cases: fixed, autoGrow with maxRows, maxLength, disabled/readonly.
Out of scope:  a rich editor (HtmlEditor, P2), a character counter.
