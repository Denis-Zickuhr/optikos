import { SuggestField, type SuggestConfig } from '../suggestfield/suggestfield';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import type { Model } from '../../../data/model';
import type { Store } from '../../../data/store';
import { iconEl } from '../../base/icon/icon';
import { Window } from '../../overlays/window/window';
import { SearchGrid, resolveLookup, lookupStore, filterInfo, type LookupDef } from '../../data/searchgrid/searchgrid';

addMessages('en', {
  lookupOpen: 'Open search',
  lookupSelect: 'Select',
});
addMessages('pt-BR', {
  lookupOpen: 'Abrir pesquisa',
  lookupSelect: 'Selecionar',
});

export interface LookupFieldConfig<V = unknown> extends SuggestConfig<V> {
  /** A definition or the name given to `registerLookup`. */
  lookup: LookupDef | string;
}

/**
 * Pick a record from a big set: type to get suggestions, or press the magnifier (or F4) to open a search window
 * with filters and a grid. The value is the record's `valueField`; the text is its `displayField`.
 */
export class LookupField<V = unknown> extends SuggestField<V> {
  protected override baseCls = 'op-field op-textfield op-picker op-suggest op-lookup';
  private def: LookupDef;
  private suggestStore?: Store<any>;
  private win?: Window;

  constructor(config: LookupFieldConfig<V>) {
    const def = resolveLookup(config.lookup);
    super({
      ...config,
      icon: false,
      valueField: def.valueField ?? 'id',
      displayField: def.displayField ?? 'name',
      query: (text) => this.suggest(text),
    });
    this.def = def;
  }

  /** Typing: filter a private store by the quick-search field and offer its page of records. */
  private async suggest(text: string) {
    const s = (this.suggestStore ??= lookupStore(this.def));
    const name = this.def.queryField ?? (this.def.filters?.[0] && filterInfo(this.def.filters[0]).name) ?? this.config.displayField!;
    const field = this.def.filters?.map(filterInfo).find((f) => f.name === name)?.field ?? name;
    await s.filter({ field, op: 'contains', value: text });
    return s.getData();
  }

  protected override createControl() {
    const wrap = super.createControl();
    const btn = h('button', 'op-picker__trigger op-lookup__btn', { type: 'button', tabindex: -1, 'aria-label': t('lookupOpen'), 'aria-haspopup': 'dialog' }, iconEl('search'));
    this.listen(btn, 'mousedown', (e: Event) => e.preventDefault());
    this.listen(btn, 'click', () => this.openDialog());
    wrap.append(btn);
    this.own(() => this.win?.destroy());
    return wrap;
  }

  protected override onKey(e: KeyboardEvent) {
    if (e.key === 'F4' || (e.altKey && e.key === 'ArrowDown')) {
      e.preventDefault();
      this.openDialog();
    } else super.onKey(e);
  }

  protected override onDisabled(disabled: boolean) {
    super.onDisabled(disabled);
    (this.el.querySelector('.op-lookup__btn') as HTMLButtonElement).disabled = disabled;
  }

  /** Opens the search window; the text typed so far pre-fills the quick-search field. */
  openDialog(): void {
    if (this.win || this.config.disabled || this.config.readonly || !this.rendered) return;
    this.close();
    const d = this.def;
    const sg = new SearchGrid({ lookup: d, flex: 1 });
    const text = this.typed ? this.input.value : '';
    sg.on('confirm', (recs: Model[]) => done(recs));
    const done = (recs: Model[]) => {
      if (recs[0]) this.pickRecord(recs[0]);
      win.close();
    };
    const win: Window = (this.win = new Window({
      title: d.title ?? t('search'),
      width: d.width ?? 720,
      height: d.height ?? 520,
      layout: 'fit',
      items: [sg],
      buttons: [{ text: t('cancel'), handler: () => win.close() }, { text: t('lookupSelect'), variant: 'primary', handler: () => done(sg.getSelection()) }],
    }));
    win.on('destroy', () => {
      this.win = undefined;
      if (this.rendered) this.input.focus();
    });
    win.show();
    if (text) void sg.search(text);
  }

  private pickRecord(rec: Model): void {
    const { valueField, displayField } = this.config;
    const item = { value: rec.get(valueField!), label: String(rec.get(displayField!) ?? rec.get(valueField!) ?? ''), raw: rec.data };
    this.pick(item as any);
  }
}
register('lookupfield', LookupField);
