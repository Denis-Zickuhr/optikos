import { register } from '../../../core/registry';
import { Checkbox, type CheckboxConfig } from '../checkbox/checkbox';

export type ToggleConfig = Omit<CheckboxConfig, 'indeterminate'>;

/** An on/off switch: a Checkbox with `role="switch"` and a track-and-knob look. Same value (`boolean`), events and API. */
export class Toggle extends Checkbox {
  protected override baseCls = 'op-field op-checkbox op-toggle';

  protected override onRender() {
    super.onRender();
    this.inputEl.setAttribute('role', 'switch');
  }

  /** A switch has no third state. */
  override setIndeterminate(): void {
    super.setIndeterminate(false);
  }
}
register('toggle', Toggle);
