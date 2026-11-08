import { Form, type FormConfig } from '../form/form';
import { Container, type ContainerConfig } from '../../../core/container';
import { Component } from '../../../core/component';
import { Field } from '../../../core/field';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t } from '../../../core/i18n';
import type { LayoutSpec } from '../../../layout/layout';
import { Stepper } from '../../navigation/stepper/stepper';
import { Button } from '../../base/button/button';
import { Toolbar } from '../../layout/toolbar/toolbar';
import '../../layout/container/container';

export interface FormStep {
  title: string;
  description?: string;
  icon?: string;
  /** May be left alone: the stepper says "optional" (its fields are still validated if filled wrongly). */
  optional?: boolean;
  items: ContainerConfig['items'];
  /** Default: two columns (one on a phone). */
  layout?: LayoutSpec;
}

export interface StepFormConfig extends FormConfig {
  steps: FormStep[];
  /** Moving forward validates the steps on the way. `false` lets the user click any step. Default true. */
  linear?: boolean;
  /** Adds a last "Review" step with a summary of the values; a function renders the summary yourself. */
  review?: boolean | ((values: Record<string, any>, form: StepForm) => string | Node);
  reviewTitle?: string;
  backText?: string;
  nextText?: string;
  finishText?: string;
  /** Shows a Cancel button (fires `cancel`). */
  cancelText?: string;
}

/** The summary pane of the review step. */
class ReviewPane extends Component {
  protected override baseCls = 'op-stepform__review';
  setContent(nodes: Array<Node | string>) {
    this.el.replaceChildren(...nodes);
  }
}

/** One form, several steps: a Stepper on top, one step at a time, Back / Next / Finish, validation per step and an optional review. */
export class StepForm extends Form {
  protected override baseCls = 'op-form op-stepform';
  private stepper!: Stepper;
  private body!: Container;
  private pane?: ReviewPane;
  private backBtn!: Button;
  private nextBtn!: Button;
  private finishBtn!: Button;
  private index = 0;

  constructor(config: StepFormConfig) {
    let me!: StepForm;
    const steps = config.steps ?? [];
    const review = config.review ? new ReviewPane() : undefined;
    const stepper = new Stepper({ steps: [...steps.map(({ title, description, icon, optional }) => ({ title, description, icon, optional })), ...(review ? [{ title: config.reviewTitle ?? t('stepReview') }] : [])] });
    const panels = [
      ...steps.map((s) => ({ type: 'container', title: s.title, cls: 'op-stepform__step', layout: s.layout ?? { type: 'grid', columns: 2, gap: 12 }, items: s.items })),
      ...(review ? [{ type: 'container', title: config.reviewTitle ?? t('stepReview'), cls: 'op-stepform__step', items: [review] }] : []),
    ];
    const body = new Container({ cls: 'op-stepform__body', flex: 1, layout: { type: 'card' }, items: panels as never });
    const backBtn = new Button({ text: config.backText ?? t('stepBack'), handler: () => me.back() });
    const nextBtn = new Button({ text: config.nextText ?? t('stepNext'), variant: 'primary', handler: () => me.next() });
    const finishBtn = new Button({ text: config.finishText ?? t('stepFinish'), variant: 'primary', htmlType: 'submit' });
    const cancel = config.cancelText ? [new Button({ text: config.cancelText, variant: 'ghost', handler: () => me.emit('cancel') })] : [];
    const footer = new Toolbar({ cls: 'op-stepform__footer', items: [...cancel, '->', backBtn, nextBtn, finishBtn] });
    super({ ...config, layout: { type: 'vbox' }, items: [stepper, body, footer] });
    me = this;
    Object.assign(this, { stepper, body, pane: review, backBtn, nextBtn, finishBtn });
    stepper.on('before-select', (i: number) => (me.goTo(i), false));
    body.on('activate', () => me.onActivate());
  }

  private cfg(): StepFormConfig {
    return this.config as unknown as StepFormConfig;
  }

  private count(): number {
    return this.body.items.length;
  }
  private real(): number {
    return this.count() - (this.pane ? 1 : 0);
  }

  getStep(): number {
    return this.index;
  }
  getStepCount(): number {
    return this.count();
  }
  getStepper(): Stepper {
    return this.stepper;
  }

  private stepFields(i: number): Field<any>[] {
    const step = this.body.items[i];
    return step instanceof Container ? (step.query((c) => c instanceof Field) as Field<any>[]) : [];
  }

  /** Validates one step's fields (marks the errors, sets its state on the stepper). */
  validateStep(i: number): boolean {
    if (i >= this.real()) return true;
    const bad = this.stepFields(i).filter((f) => !f.validate());
    this.stepper.setStepState(i, bad.length ? 'error' : 'done');
    return !bad.length;
  }

  /** Moves to a step. Forward with `linear` validates the steps on the way and stops at the first invalid one. Returns whether it got there. */
  goTo(j: number): boolean {
    if (j < 0 || j >= this.count() || j === this.index) return false;
    if (this.emit('before-step-change', this.index, j) === false) return false;
    let target = j;
    if (this.cfg().linear !== false && j > this.index) {
      for (let k = this.index; k < j; k++) {
        if (!this.validateStep(k)) {
          target = k;
          break;
        }
      }
    }
    if (target !== this.index) this.body.setActiveItem(target);
    if (target !== j) this.stepFields(target).find((f) => f.getError())?.focus();
    return target === j;
  }
  next(): boolean {
    return this.goTo(this.index + 1);
  }
  back(): boolean {
    return this.goTo(this.index - 1);
  }

  /** The card layout changed the visible step (by `goTo`, or because `validate` brought an invalid field into view). */
  private onActivate(): void {
    const i = this.body.items.indexOf(this.body.getActiveItem()!);
    if (i < 0) return;
    const from = this.index;
    this.index = i;
    this.stepper.setActive(i);
    const last = this.count() - 1;
    this.backBtn.config.hidden = i === 0;
    this.nextBtn.config.hidden = i === last;
    this.finishBtn.config.hidden = i !== last;
    for (const [b, hide] of [[this.backBtn, i === 0], [this.nextBtn, i === last], [this.finishBtn, i !== last]] as const) if (b.rendered) b.el.hidden = hide;
    if (this.pane && i === last) this.refreshReview();
    if (i !== from) {
      this.emit('step-change', i, from);
      if (this.rendered && this.el.isConnected && !this.stepFields(i).some((f) => f.getError())) this.stepFields(i)[0]?.focus();
    }
  }

  private refreshReview(): void {
    const values = this.getValues();
    const fn = this.cfg().review;
    if (typeof fn === 'function') return this.pane!.setContent([fn(values, this)]);
    const out: Array<Node | string> = [];
    for (let i = 0; i < this.real(); i++) {
      const rows = this.stepFields(i).filter((f) => f.name);
      if (!rows.length) continue;
      out.push(h('h3', 'op-stepform__review-title', {}, String((this.body.items[i].config as { title?: string }).title ?? '')));
      out.push(h('dl', 'op-stepform__review-list', {}, ...rows.flatMap((f) => [h('dt', '', {}, f.config.label ?? (f.config as { boxLabel?: string }).boxLabel ?? f.name!), h('dd', '', {}, this.show_(f))])));
    }
    this.pane!.setContent(out);
  }

  /** What the user sees for a field (its display text; ticks for booleans, dots for passwords). */
  private show_(f: Field<any>): string {
    const v = f.getValue();
    if (typeof v === 'boolean') return v ? '✓' : '—';
    if ((f.config as { inputType?: string }).inputType === 'password') return v ? '••••••••' : '—';
    const text = f.getDisplayText();
    if (text) return text;
    return v && typeof v === 'object' && !Array.isArray(v) ? Object.values(v).filter(Boolean).join(' – ') || '—' : Array.isArray(v) ? v.join(', ') || '—' : '—';
  }

  /** Enter and the Finish button: Next on every step but the last; on the last, validate everything and `finish`. */
  override submit(): boolean {
    if (this.index < this.count() - 1) {
      this.next();
      return false;
    }
    const ok = super.submit();
    for (let i = 0; i < this.real(); i++) this.stepper.setStepState(i, this.stepFields(i).some((f) => f.getError()) ? 'error' : 'done');
    if (ok) this.emit('finish', this.getValues());
    return ok;
  }

  /** Clears the values and goes back to the first step. */
  override reset(): void {
    super.reset();
    this.clearErrors();
    for (let i = 0; i < this.count(); i++) this.stepper.setStepState(i, 'pending');
    if (this.index !== 0) this.body.setActiveItem(0);
  }
}
register('stepform', StepForm);
