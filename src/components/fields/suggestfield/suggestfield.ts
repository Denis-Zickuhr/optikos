import { PickerField, type PickerConfig, type ListItem, type Option } from '../pickerfield/pickerfield';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t } from '../../../core/i18n';
import { iconEl } from '../../base/icon/icon';

export interface SuggestConfig<V = unknown> extends PickerConfig<V> {
  /** Async search. Receives the text and an AbortSignal that fires when a newer search starts. */
  query?: (text: string, ctx: { signal: AbortSignal }) => Promise<Option[]> | Option[];
  minChars?: number;
  /** Debounce in ms. */
  delay?: number;
  highlight?: boolean;
  /** Leading icon name; `false` hides it. Default: the magnifier (`search`). */
  icon?: string | false;
}

/** Search-as-you-type field: results come from `query` (or a Store with a proxy), not from a fixed list. */
export class SuggestField<V = unknown> extends PickerField<V, SuggestConfig<V>> {
  protected override baseCls = 'op-field op-textfield op-picker op-suggest';
  private seq = 0;
  private abort?: AbortController;
  private cancelWait?: () => void;
  private live!: HTMLElement;

  protected override hasTrigger() {
    return false;
  }
  protected override emptyValue(): V {
    return null as V;
  }
  protected override isEmpty(v: V) {
    return v == null || (v as unknown) === '';
  }

  protected override createControl() {
    const wrap = super.createControl();
    if (this.config.icon !== false) {
      wrap.classList.add('has-icon');
      wrap.prepend(h('span', 'op-suggest__icon', { 'aria-hidden': 'true' }, iconEl(this.config.icon ?? 'search')));
    }
    wrap.append(h('span', 'op-spinner op-picker__spinner', { 'aria-hidden': 'true' }));
    this.live = h('div', 'op-sr-only', { 'aria-live': 'polite' });
    wrap.append(this.live);
    this.own(() => this.abort?.abort());
    return wrap;
  }

  protected override onRender() {
    super.onRender();
    // with a Store the results arrive through its change events
    this.config.store?.on('load', () => this.showResults(this.items));
  }

  protected override onType(text: string) {
    this.cancelWait?.();
    this.abort?.abort();
    if (text.trim().length < (this.config.minChars ?? 1)) {
      this.items = [];
      this.refreshList();
      this.setSearching(false);
      return this.close();
    }
    this.cancelWait = this.later(() => void this.search(text), this.config.delay ?? 250);
  }

  /** Runs a search now (skips the debounce). */
  async search(text: string): Promise<void> {
    if (this.emit('before-query', text) === false) return;
    const seq = ++this.seq;
    const ctl = (this.abort = new AbortController());
    this.setSearching(true);
    this.emit('query', text);
    try {
      const c = this.config;
      let options: Option[];
      if (c.store) {
        await c.store.load({ query: text });
        options = c.store.getData();
      } else {
        options = (await c.query?.(text, { signal: ctl.signal })) ?? [];
      }
      if (seq !== this.seq) return;
      this.items = options.map((o) => this.toItem(o));
      this.showResults(this.items, text);
      this.emit('load', this.items);
    } catch (err) {
      if (seq !== this.seq) return;
      this.setSearching(false);
      this.close();
      this.emit('error', err);
    }
  }

  private showResults(items: ListItem[], text = this.input.value) {
    this.setSearching(false);
    this.typed = true;
    this.refreshList();
    this.list.setHighlight(this.config.highlight === false ? '' : text);
    this.live.textContent = items.length ? t('results', { n: items.length }) : t('noResults');
    if (document.activeElement === this.input) this.open();
  }

  private setSearching(on: boolean) {
    this.el.classList.toggle('is-searching', on);
    this.input.setAttribute('aria-busy', String(on));
  }

  setQuery(query: NonNullable<SuggestConfig['query']>) {
    this.config.query = query;
  }

  clearSuggestions() {
    this.items = [];
    this.refreshList();
    this.close();
  }

  protected override pick(item: ListItem) {
    super.pick(item);
    this.list.setHighlight('');
  }
}
register('suggestfield', SuggestField);
