import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t } from '../../../core/i18n';
import { iconEl } from '../../base/icon/icon';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

export interface AlertConfig extends ComponentConfig {
  /** Default `info`. */
  tone?: AlertTone;
  title?: string;
  text?: string;
  /** Default by tone; `false` leaves it out. */
  icon?: string | false;
  /** A close button: hides the alert and fires `close`. */
  closable?: boolean;
  /** Default `alert` for `warning` and `danger` (read at once), `status` for the others (read when idle). */
  role?: 'alert' | 'status' | 'note';
}

const ICON: Record<AlertTone, string> = { info: 'info', success: 'success', warning: 'alert', danger: 'error' };

/** A message in the page, not over it: a form error, "nothing here yet", a notice. */
export class Alert extends Component<AlertConfig> {
  protected override baseCls = 'op-alert';
  private titleEl = h('div', 'op-alert__title');
  private textEl = h('div', 'op-alert__text');
  private iconEl = h('span', 'op-alert__icon', { 'aria-hidden': 'true' });

  protected override onRender() {
    const body = h('div', 'op-alert__body', {}, this.titleEl, this.textEl);
    this.el.append(this.iconEl, body);
    if (this.config.closable) {
      const x = h('button', 'op-alert__close', { type: 'button', 'aria-label': t('close') }, iconEl('x'));
      this.listen(x, 'click', () => this.close());
      this.el.append(x);
    }
    this.setTone(this.config.tone ?? 'info');
    this.setTitle(this.config.title ?? '');
    this.setText(this.config.text ?? '');
  }

  setTone(tone: AlertTone) {
    this.config.tone = tone;
    if (!this.rendered) return;
    for (const k of Object.keys(ICON)) this.el.classList.toggle(`op-alert--${k}`, k === tone);
    this.el.setAttribute('role', this.config.role ?? (tone === 'danger' || tone === 'warning' ? 'alert' : 'status'));
    this.setIcon(this.config.icon);
  }

  setIcon(icon: string | false | undefined) {
    this.config.icon = icon;
    if (!this.rendered) return;
    const name = icon === undefined ? ICON[this.config.tone ?? 'info'] : icon;
    this.iconEl.replaceChildren(...(name ? [iconEl(name)] : []));
    this.iconEl.hidden = !name;
  }

  setTitle(title: string) {
    this.config.title = title;
    if (!this.rendered) return;
    this.titleEl.textContent = title;
    this.titleEl.hidden = !title;
  }

  setText(text: string) {
    this.config.text = text;
    if (!this.rendered) return;
    this.textEl.textContent = text;
    this.textEl.hidden = !text;
  }

  /** Hides it and fires `close`; `show()` brings it back. */
  close() {
    this.hide();
    this.emit('close');
  }
}
register('alert', Alert);
