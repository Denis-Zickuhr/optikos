import { Container, type ContainerConfig } from '../../../core/container';
import { register, type AnyConfig } from '../../../core/registry';
import { roving } from '../../../core/focus';
import '../spacer/spacer';

export interface ToolbarConfig extends ContainerConfig {
  vertical?: boolean;
}

// Only buttons join the roving tab stop; text fields keep their own arrow-key behavior.
const FOCUSABLE = 'button:not(:disabled)';

/** Items may be `'->'` (fill space), `'-'` (separator) or `' '` (small gap). */
export class Toolbar extends Container<ToolbarConfig> {
  protected override baseCls = 'op-toolbar';
  private rover?: ReturnType<typeof roving>;

  protected override shorthand(s: string): AnyConfig {
    if (s === '->') return { type: 'spacer' };
    if (s === '-') return { type: 'spacer', line: true };
    if (s === ' ') return { type: 'spacer', width: 8 };
    throw new Error(`Optikos: unknown toolbar shorthand "${s}"`);
  }

  protected override build() {
    const el = super.build();
    el.setAttribute('role', 'toolbar');
    if (this.config.vertical) el.setAttribute('aria-orientation', 'vertical');
    return el;
  }

  protected override onRender() {
    this.config.layout ??= this.config.vertical ? { type: 'vbox', align: 'stretch' } : { type: 'hbox', align: 'center' };
    super.onRender();
    this.el.classList.toggle('op-toolbar--vertical', !!this.config.vertical);
    // Roving tabindex over buttons: one Tab stop, arrows move.
    this.rover = roving(this.el, { selector: FOCUSABLE, orientation: this.config.vertical ? 'vertical' : 'horizontal' });
    this.own(() => this.rover?.destroy());
  }

  override notifyMount() {
    super.notifyMount();
    this.rover?.sync();
  }
}
register('toolbar', Toolbar);
