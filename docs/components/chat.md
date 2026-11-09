# Chat  (type: 'chat')
Purpose:       A live conversation: a growing list of messages, a composer, a "typing" indicator and streamed replies. Works for a messaging app or for an AI mode inside an app.
Anatomy:       `.op-chat` > `__log[role=log][aria-live=polite]` (scrollable) > `__day` (day separator) and `__msg` (`is-me`/`is-them`, `is-first`/`is-last` of a group) > `__author` (only on the 1st of a group, in group chats),
               `__bubble` (formatted text, `__reply` quoting another message) and `__meta` (time + `__status` ticks); `__typing` (three dots); `__suggestions` (prompt chips) and `__composer` (textarea + send button).
Config:        `messages: ChatMessage[]`, `me: string` (the id of the current user; decides the bubble side), `users: Record<id, { name, color? }>` (names; `showAuthors: false` hides them),
               `placeholder`, `suggestions: string[]` (chips above the field; clicking sends), `readonly: false`, `sendOnEnter: true` (Shift+Enter adds a line break), `maxLength`,
               `renderer?: (msg) => string | Node` (custom bubble content; the default is minimal, safe formatting: `**bold**`, `*italic*`, `` `code` ``, line breaks, links shown but not clickable).
ChatMessage:   `{ id, from: string, text, time: number | Date | string, status?: 'sending'|'sent'|'delivered'|'read'|'error', replyTo?: id, meta?: unknown }`.
API:           `addMessage(msg)` (returns the message; automatic id when missing), `setMessages(list)`, `updateMessage(id, patch)`, `appendToMessage(id, text)` (streaming: only the bubble's text node changes),
               `removeMessage(id)`, `getMessages()`, `setTyping(who | boolean)` ("Ann is typing…" or just the dots), `setSuggestions(list)`, `send(text)` (the same path as the button),
               `scrollToBottom()`, `setBusy(bool)` (disables sending, e.g. while an AI answers), `focus()`, `setReadonly`, `setPlaceholder`.
Events:        `before-send(text)` (cancelable), `send(text, message)`; the message shows at once (status `sending`) and the app updates it with `updateMessage`. `suggestion(text)`, `message-click(msg)`.
States:        `is-busy`, `is-empty` ("no messages" text); scrolling follows the end only if the user was already near the end (it never yanks the view).
Keyboard/ARIA: Enter sends, Shift+Enter adds a line break, Esc in the field does nothing; the log is `role=log` with `aria-live=polite` (each new message is announced); the button has an `aria-label`; suggestion chips are buttons.
Tokens:        `--op-chat-bg`, `--op-chat-bubble-me-bg/fg`, `--op-chat-bubble-them-bg/fg`, `--op-chat-bubble-radius`, `--op-chat-gap`, `--op-chat-max-width` (bubble width), `--op-chat-day-bg`, `--op-chat-read-fg`.
Sandbox cases: static conversation with statuses and days, sending with a simulated reply (typing), a streamed "AI" answer, a group with authors, suggestions, read-only.
Out of scope:  attachments/audio/emoji, full markdown (lists, tables, code blocks), reactions, editing, search in the conversation, virtualization (thousands of messages: page or cap them in the app).
