import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import { iconEl } from '../icon/icon';

addMessages('en', { chipRemove: 'Remove {text}' });
addMessages('pt-BR', { chipRemove: 'Remover {text}' });

export interface ChipConfig extends ComponentConfig {
  text?: string;
  icon?: string;
  /** Click toggles it on and off (a filter, a tag being picked): a toggle button with `aria-pressed`. */
  selectable?: boolean;
  selected?: boolean;
  /** Shows a × button that fires `remove` (the app removes the chip). */
  removable?: boolean;
  disabled?: boolean;
  handler?: (chip: Chip) => void;
}

/** A compact token: a filter to toggle, a tag to remove, a choice to click. */
export class Chip extends Component<ChipConfig> {
  protected override baseCls = 'op-chip';
  protected override tag = 'span' as const;
  private main!: HTMLButtonElement;
  private textEl!: HTMLElement;
  private removeBtn?: HTMLButtonElement;

  protected override onRender() {
    const c = this.config;
    this.textEl = h('span', 'op-chip__text');
    this.main = h('button', 'op-chip__main', { type: 'button' }, c.icon ? iconEl(c.icon) : '', this.textEl);
    this.el.append(this.main);
    this.listen(this.main, 'click', () => {
      if (this.config.disabled) return;
      if (this.config.selectable) this.setSelected(!this.config.selected, true);
      this.config.handler?.(this);
      this.emit('click', this);
    });
    if (c.removable) {
      this.removeBtn = h('button', 'op-chip__remove', { type: 'button' }, iconEl('x'));
      this.el.append(this.removeBtn);
      this.listen(this.removeBtn, 'click', () => !this.config.disabled && this.emit('remove', this));
      this.listen(this.main, 'keydown', (e: KeyboardEvent) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && !this.config.disabled) this.emit('remove', this);
      });
    }
    this.setText(c.text ?? '');
    this.setSelected(!!c.selected);
    this.setDisabled(!!c.disabled);
  }

  setText(text: string) {
    this.config.text = text;
    if (!this.rendered) return;
    this.textEl.textContent = text;
    this.removeBtn?.setAttribute('aria-label', t('chipRemove', { text }));
  }
  /** Selected state (only meaningful with `selectable`); `notify` fires `change`. */
  setSelected(on: boolean, notify = false) {
    this.config.selected = on;
    if (!this.rendered) return;
    this.el.classList.toggle('is-selected', on);
    if (this.config.selectable) this.main.setAttribute('aria-pressed', String(on));
    if (notify) this.emit('change', on);
  }
  isSelected(): boolean {
    return !!this.config.selected;
  }
  override setDisabled(disabled: boolean) {
    super.setDisabled(disabled);
    if (!this.rendered) return;
    this.main.disabled = disabled;
    if (this.removeBtn) this.removeBtn.disabled = disabled;
  }
  protected override focusEl(): HTMLElement {
    return this.main;
  }
}
register('chip', Chip);
