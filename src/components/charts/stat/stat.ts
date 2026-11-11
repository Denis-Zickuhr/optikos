import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, getLocale, addMessages } from '../../../core/i18n';
import { format, type Formatter } from '../../../data/format';
import { iconEl } from '../../base/icon/icon';
import { Chart } from '../chart/chart';

addMessages('en', { statUp: 'up {n}', statDown: 'down {n}', statFlat: 'unchanged' });
addMessages('pt-BR', { statUp: 'subiu {n}', statDown: 'caiu {n}', statFlat: 'sem variação' });

export interface StatConfig extends ComponentConfig {
  label: string;
  value?: number | string | null;
  /** Name of a registered format (`money`, `percent`...) or a function, for a numeric `value`. */
  format?: string | Formatter;
  /** The change since the last period, as a fraction (`0.125` shows `+12.5%`). */
  delta?: number;
  /** Which way is good news. `down` for costs, errors or waiting times. Default `up`. */
  good?: 'up' | 'down';
  /** Small text under the value ("vs last week"). */
  caption?: string;
  icon?: string;
  /** Numbers for a sparkline beside the value. */
  trend?: number[];
}

/** A KPI tile: a label, a big value, the change since last time and an optional sparkline. */
export class Stat extends Component<StatConfig> {
  protected override baseCls = 'op-stat';
  private labelEl!: HTMLElement;
  private valueEl!: HTMLElement;
  private deltaEl!: HTMLElement;
  private captionEl!: HTMLElement;
  private chart?: Chart;

  protected override build() {
    this.labelEl = h('div', 'op-stat__label');
    this.valueEl = h('div', 'op-stat__value');
    this.deltaEl = h('span', 'op-stat__delta');
    this.captionEl = h('span', 'op-stat__caption');
    return h('div', this.baseCls, {}, this.labelEl, h('div', 'op-stat__row', {}, this.valueEl, this.deltaEl), this.captionEl);
  }

  protected override onRender() {
    const c = this.config;
    this.setLabel(c.label);
    this.setValue(c.value ?? null);
    this.setDelta(c.delta);
    this.setCaption(c.caption ?? '');
    this.setTrend(c.trend);
  }

  setLabel(label: string) {
    this.config.label = label;
    if (!this.rendered) return;
    this.labelEl.replaceChildren(...(this.config.icon ? [iconEl(this.config.icon)] : []), label);
  }

  setValue(value: number | string | null) {
    this.config.value = value;
    if (this.rendered) this.valueEl.textContent = value == null ? '—' : typeof value === 'number' ? format(this.config.format ?? 'number', value) : value;
  }

  setDelta(delta: number | undefined) {
    this.config.delta = delta;
    if (!this.rendered) return;
    const up = (delta ?? 0) > 0;
    const good = (this.config.good ?? 'up') === 'up' ? up : !up;
    this.deltaEl.hidden = delta == null;
    this.deltaEl.className = `op-stat__delta ${!delta ? 'is-flat' : good ? 'is-good' : 'is-bad'}`;
    if (delta == null) return;
    const text = new Intl.NumberFormat(getLocale()._lang, { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }).format(delta);
    this.deltaEl.replaceChildren(iconEl(!delta ? 'minus' : up ? 'arrow-up' : 'arrow-down'), h('span', '', { 'aria-hidden': 'true' }, text), h('span', 'op-sr-only', {}, !delta ? t('statFlat') : t(up ? 'statUp' : 'statDown', { n: text.replace(/^[+-]/, '') })));
  }

  setCaption(caption: string) {
    this.config.caption = caption;
    if (this.rendered) {
      this.captionEl.textContent = caption;
      this.captionEl.hidden = !caption;
    }
  }

  setTrend(trend: number[] | undefined) {
    this.config.trend = trend;
    if (!this.rendered) return;
    if (!trend?.length) return void (this.chart?.destroy(), (this.chart = undefined));
    const data = trend.map((v, i) => ({ i, v }));
    if (this.chart) return this.chart.setData(data);
    this.chart = new Chart({ kind: 'sparkline', x: 'i', series: ['v'], data, cls: 'op-stat__spark', ariaLabel: this.config.label });
    this.el.append(this.chart.el);
    this.chart.notifyMount();
  }

  protected override onDestroy() {
    this.chart?.destroy();
  }
}
register('stat', Stat);
