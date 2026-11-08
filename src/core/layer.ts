let root: HTMLElement | undefined;

/** The single `body > .op-layer` that holds every floating element (dropdowns, windows, tooltips, toasts). */
export function layer(): HTMLElement {
  if (!root || !root.isConnected) {
    root = document.createElement('div');
    root.className = 'op-layer';
    document.body.appendChild(root);
  }
  return root;
}

/** Moves `el` into the layer, keeping the theme scope of `from` (floating elements leave their themed ancestor). */
export function toLayer(el: HTMLElement, from?: Element | null): void {
  const theme = from?.closest('[data-op-theme]')?.getAttribute('data-op-theme');
  if (theme) el.setAttribute('data-op-theme', theme);
  layer().appendChild(el);
}

/** Makes everything except `modal` inert (outside the layer and earlier layer children). Returns the release function. */
export function lockModal(modal: HTMLElement): () => void {
  const l = layer();
  const locked = [...Array.from(document.body.children), ...Array.from(l.children)].filter(
    (e) => e !== l && e !== modal && !e.hasAttribute('inert') && !e.classList.contains('op-toast-region'),
  );
  for (const e of locked) e.setAttribute('inert', '');
  return () => locked.forEach((e) => e.removeAttribute('inert'));
}
