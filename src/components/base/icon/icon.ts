// Built-in icon paths come from Lucide (ISC) and Feather (MIT); see THIRD_PARTY_NOTICES.md.
import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';

const s = (d: string) => `<path d="${d}"/>`;
const icons: Record<string, string> = {
  'chevron-down': s('m6 9 6 6 6-6'),
  'chevron-up': s('m18 15-6-6-6 6'),
  'chevron-left': s('m15 18-6-6 6-6'),
  'chevron-right': s('m9 18 6-6-6-6'),
  'chevrons-left': s('m11 17-5-5 5-5M18 17l-5-5 5-5'),
  'chevrons-right': s('m6 17 5-5-5-5M13 17l5-5-5-5'),
  x: s('M18 6 6 18M6 6l12 12'),
  check: s('M20 6 9 17l-5-5'),
  plus: s('M5 12h14M12 5v14'),
  minus: s('M5 12h14'),
  search: '<circle cx="11" cy="11" r="8"/>' + s('m21 21-4.3-4.3'),
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/>' + s('M16 2v4M8 2v4M3 10h18'),
  info: '<circle cx="12" cy="12" r="10"/>' + s('M12 16v-4M12 8h.01'),
  alert: s('m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3ZM12 9v4M12 17h.01'),
  error: '<circle cx="12" cy="12" r="10"/>' + s('m15 9-6 6M9 9l6 6'),
  success: '<circle cx="12" cy="12" r="10"/>' + s('m9 12 2 2 4-4'),
  menu: s('M4 6h16M4 12h16M4 18h16'),
  'arrow-up': s('m5 12 7-7 7 7M12 19V5'),
  'arrow-down': s('M12 5v14M19 12l-7 7-7-7'),
  columns: '<rect x="3" y="3" width="18" height="18" rx="2"/>' + s('M9 3v18M15 3v18'),
  filter: s('M22 3H2l8 9.5V19l4 2v-8.5z'),
  send: s('m22 2-7 20-4-9-9-4zM22 2 11 13'),
  sparkles: s('M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9zM19 3v4M21 5h-4M5 17v4M7 19H3'),
  file: s('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8'),
  box: s('M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8'),
  truck: s('M1 3h15v13H1zM16 8h4l3 3v5h-7') + '<circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="10"/>' + s('M12 6v6l4 2'),
  shield: s('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'),
  list: s('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'),
  eye: s('M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z') + '<circle cx="12" cy="12" r="3"/>',
  'eye-off': s('M17.9 17.9A10.1 10.1 0 0 1 12 19c-6.4 0-10-7-10-7a18.5 18.5 0 0 1 5.1-5.9M9.9 5.2A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a18.5 18.5 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20'),
  heart: s('M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z'),
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/>' + s('m21 15-5-5L5 21'),
  cloud: s('M18 10h-1.3A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z'),
  folder: s('M4 4h5l2 3h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z'),
  share: s('M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14'),
  message: s('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'),
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  user: s('M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2') + '<circle cx="12" cy="7" r="4"/>',
  home: s('m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10'),
  trash: s('M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'),
  edit: s('M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'),
  sun: '<circle cx="12" cy="12" r="4"/>' + s('M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'),
  moon: s('M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'),
  bell: s('M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0'),
  chart: s('M3 3v18h18M19 9l-5 5-4-4-3 3'),
  settings: '<circle cx="12" cy="12" r="3"/>' + s('M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1'),
  users: s('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8') + '<circle cx="9" cy="7" r="4"/>',
};

/** Registers icons by name. A value is either SVG inner markup (24×24 viewBox, stroke style) or a full `<svg>` string. Trusted: comes from your code. */
export function registerIcons(map: Record<string, string>): void {
  Object.assign(icons, map);
}

export const hasIcon = (name: string): boolean => name in icons;

/** A `<span class="op-icon">` holding the SVG. Decorative unless `label` is given. */
export function iconEl(name: string, label?: string): HTMLElement {
  const el = h('span', 'op-icon');
  setIcon(el, name, label);
  return el;
}

function setIcon(el: HTMLElement, name: string, label?: string) {
  if (name && !(name in icons)) console.warn(`Optikos: unknown icon "${name}" (register it with registerIcons)`);
  const svg = icons[name] ?? '';
  el.innerHTML = svg.startsWith('<svg') ? svg : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg}</svg>`;
  if (label) {
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', label);
    el.removeAttribute('aria-hidden');
  } else {
    el.setAttribute('aria-hidden', 'true');
    el.removeAttribute('role');
    el.removeAttribute('aria-label');
  }
}

export interface IconConfig extends ComponentConfig {
  name?: string;
  label?: string;
}

export class Icon extends Component<IconConfig> {
  protected override baseCls = 'op-icon';
  protected override tag = 'span' as const;
  protected override onRender() {
    setIcon(this.el, this.config.name ?? '', this.config.label);
  }
  setName(name: string) {
    this.config.name = name;
    if (this.rendered) setIcon(this.el, name, this.config.label);
  }
  setLabel(label: string) {
    this.config.label = label;
    if (this.rendered) setIcon(this.el, this.config.name ?? '', label);
  }
}
register('icon', Icon);
