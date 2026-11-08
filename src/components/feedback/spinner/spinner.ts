import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { t } from '../../../core/i18n';

export interface SpinnerConfig extends ComponentConfig {
  label?: string;
}

/** Indeterminate progress indicator. The loading mask (`loading` config on any component) uses the same element. */
export class Spinner extends Component<SpinnerConfig> {
  protected override baseCls = 'op-spinner';
  protected override tag = 'span' as const;
  protected override onRender() {
    this.el.setAttribute('role', 'progressbar');
    this.setLabel(this.config.label ?? t('loading'));
  }
  setLabel(label: string) {
    this.config.label = label;
    if (this.rendered) this.el.setAttribute('aria-label', label);
  }
}
register('spinner', Spinner);
