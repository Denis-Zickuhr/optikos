import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';

export interface SpacerConfig extends ComponentConfig {
  /** Renders a vertical separator line. */
  line?: boolean;
}

/** Without `width`/`flex` it takes the free space (`flex: 1`), pushing the next items away. */
export class Spacer extends Component<SpacerConfig> {
  protected override baseCls = 'op-spacer';
  protected override tag = 'span' as const;
  protected override onRender() {
    const c = this.config;
    if (c.width == null && c.flex == null && !c.line) this.el.style.flex = '1';
    this.setLine(!!c.line);
  }
  setLine(line: boolean) {
    this.config.line = line;
    if (!this.rendered) return;
    this.el.classList.toggle('op-spacer--line', line);
    if (line) this.el.setAttribute('role', 'separator');
    else this.el.setAttribute('aria-hidden', 'true');
    if (line) this.el.removeAttribute('aria-hidden');
  }
}
register('spacer', Spacer);
