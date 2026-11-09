import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import { iconEl } from '../../base/icon/icon';

addMessages('en', {
  stepOptional: 'optional',
  stepDone: 'completed',
  stepError: 'has errors',
  stepSteps: 'Steps',
});
addMessages('pt-BR', {
  stepOptional: 'opcional',
  stepDone: 'concluída',
  stepError: 'com erros',
  stepSteps: 'Etapas',
});

export interface Step {
  id?: string;
  title: string;
  description?: string;
  icon?: string;
  optional?: boolean;
}
export type StepState = 'pending' | 'done' | 'error';

export interface StepperConfig extends ComponentConfig {
  steps?: Step[];
  active?: number;
  /** Steps can be clicked. Default true. */
  clickable?: boolean;
}

/** Where you are in a multi-step process: numbered steps with done / current / error states. */
export class Stepper extends Component<StepperConfig> {
  protected override baseCls = 'op-stepper';
  protected override tag = 'nav' as const;
  private list!: HTMLElement;
  private active = 0;
  private states: StepState[] = [];

  protected override onRender() {
    const c = this.config;
    this.active = c.active ?? 0;
    this.el.setAttribute('aria-label', c.ariaLabel ?? t('stepSteps'));
    this.list = h('ol', 'op-stepper__list');
    this.el.append(this.list);
    this.listen(this.list, 'click', (e: Event) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.op-stepper__btn');
      if (!b || b.disabled) return;
      const i = Number(b.dataset.i);
      if (this.emit('before-select', i) === false) return;
      this.setActive(i);
      this.emit('select', i);
    });
    this.paint();
  }

  private steps(): Step[] {
    return this.config.steps ?? [];
  }

  private paint() {
    this.list.replaceChildren(
      ...this.steps().map((s, i) => {
        const state = this.states[i] ?? 'pending';
        const current = i === this.active;
        const marker = h('span', 'op-stepper__marker', { 'aria-hidden': 'true' }, state === 'done' && !current ? iconEl('check') : state === 'error' ? '!' : s.icon ? iconEl(s.icon) : String(i + 1));
        const status = state === 'done' && !current ? t('stepDone') : state === 'error' ? t('stepError') : '';
        const btn = h('button', 'op-stepper__btn', { type: 'button', 'data-i': i, 'aria-current': current ? 'step' : null }, marker,
          h('span', 'op-stepper__text', {},
            h('span', 'op-stepper__title', {}, s.title),
            s.description ? h('span', 'op-stepper__desc', {}, s.description) : '',
            s.optional ? h('span', 'op-stepper__opt', {}, t('stepOptional')) : '',
            status ? h('span', 'op-sr-only', {}, status) : ''));
        btn.disabled = this.config.clickable === false;
        const last = i === this.steps().length - 1;
        return h('li', `op-stepper__step${current ? ' is-current' : ''}${state === 'done' ? ' is-done' : ''}${state === 'error' ? ' is-error' : ''}${s.optional ? ' is-optional' : ''}`, {}, btn, last ? '' : h('span', 'op-stepper__line', { 'aria-hidden': 'true' }));
      }),
    );
  }

  setActive(i: number) {
    this.active = Math.max(0, Math.min(i, this.steps().length - 1));
    this.config.active = this.active;
    if (this.rendered) this.paint();
  }
  getActive(): number {
    return this.active;
  }

  setStepState(i: number, state: StepState) {
    this.states[i] = state;
    if (this.rendered) this.paint();
  }
  getStepState(i: number): StepState {
    return this.states[i] ?? 'pending';
  }

  setSteps(steps: Step[]) {
    this.config.steps = steps;
    this.states = [];
    if (this.rendered) this.paint();
  }
}
register('stepper', Stepper);
