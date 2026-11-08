import { Container, type ContainerConfig } from '../../../core/container';
import { register } from '../../../core/registry';

let current: Viewport | undefined;

/** Root container that fills the window. Only one can exist at a time. */
export class Viewport extends Container<ContainerConfig> {
  protected override baseCls = 'op-viewport';

  constructor(config: ContainerConfig = {}) {
    super(config);
    if (current && !current.destroyed) throw new Error('Optikos: only one Viewport can exist at a time');
    current = this;
  }

  protected override onRender() {
    this.config.layout ??= 'fit';
    super.onRender();
  }
}
register('viewport', Viewport);
