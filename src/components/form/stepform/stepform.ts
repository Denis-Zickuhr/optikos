import { Form, type FormConfig } from '../form/form';
import { Container, type ContainerConfig } from '../../../core/container';
import { Component } from '../../../core/component';
import { Field } from '../../../core/field';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import type { LayoutSpec } from '../../../layout/layout';
import { Stepper } from '../../navigation/stepper/stepper';
import { Button } from '../../base/button/button';
import { Toolbar } from '../../layout/toolbar/toolbar';
import '../../layout/container/container';

addMessages('en', {
  stepBack: 'Back',
  stepNext: 'Next',
  stepFinish: 'Finish',
  stepReview: 'Review',
});
addMessages('pt-BR', {
  stepBack: 'Voltar',
  stepNext: 'Próximo',
  stepFinish: 'Concluir',
  stepReview: 'Revisão',
});

export interface FormStep {
  title: string;
  description?: string;
  icon?: string;
  /** May be left alone: the stepper says "optional" (its fields are still validated if filled wrongly). */
  optional?: boolean;
  items: ContainerConfig['items'];
  /** Default: two columns (one on a phone). */
  layout?: LayoutSpec;
  /**
   * A check that may ask the server (an email already taken, a free slug), run when leaving the step forward and on Finish.
   * Return `true`, a message for the whole step, or `{ field: message }`. The signal aborts when the user goes elsewhere.
   */
  validate?: (values: Record<string, any>, form: StepForm, signal: AbortSignal) => StepCheck | Promise<StepCheck>;
}

/** The result of a step's `validate`: ok, a message for the whole step, or messages per field name. */
export type StepCheck = true | string | Record<string, string>;

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
  /** On a new step, focus its first field (a phone keyboard pops up). Default false: the step panel gets the focus. */
  autoFocus?: boolean;
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
  /** The step check in flight (Next waits for it; going elsewhere aborts it). */
  private pending?: AbortController;
  /** Each step's general message (from its `validate`), shown in one alert line above the steps. */
  private notes: string[] = [];
  private noteEl?: HTMLElement;

  constructor(config: StepFormConfig) {
    let me!: StepForm;
    const steps = config.steps ?? [];
    const review = config.review ? new ReviewPane() : undefined;
    const stepper = new Stepper({ steps: [...steps.map(({ title, description, icon, optional }) => ({ title, description, icon, optional })), ...(review ? [{ title: config.reviewTitle ?? t('stepReview') }] : [])] });
    const panels = [
      ...steps.map((s) => ({ type: 'container', title: s.title, cls: 'op-stepform__step', layout: s.layout ?? { type: 'grid', columns: 2, gap: 12 }, items: s.items })),
      ...(review ? [{ type: 'container', title: config.reviewTitle ?? t('stepReview'), cls: 'op-stepform__step', items: [review] }] : []),
    ];
    const body = new Container({ cls: 'op-stepform__body', flex: 1, layout: { type: 'card' }, items: panels });
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
    this.own(() => this.stop());
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

  /** Sets step `i`'s general message ('' clears it); it shows while that step is the current one. */
  private note(i: number, text: string): void {
    this.notes[i] = text;
    if (i === this.index) this.showNote();
  }
  private showNote(): void {
    if (!this.rendered) return;
    const text = this.notes[this.index] ?? '';
    if (!this.noteEl) {
      if (!text) return;
      this.body.el.before((this.noteEl = h('div', 'op-stepform__note', { role: 'alert' })));
    }
    this.noteEl.textContent = text;
    this.noteEl.hidden = !text;
  }

  /** Busy while a step check runs: Next and Finish show their loading state. */
  private busy(on: boolean): void {
    this.el.classList.toggle('is-validating', on);
    this.nextBtn.setLoading(on);
    this.finishBtn.setLoading(on);
  }
  /** Cancels the step check in flight, if any. */
  private stop(): void {
    if (!this.pending) return;
    this.pending.abort();
    this.pending = undefined;
    this.busy(false);
  }

  /** Runs step `k`'s `validate`. A failure marks the fields or shows the step's message. Resolves false when aborted too. */
  private async check(k: number): Promise<boolean> {
    const fn = this.cfg().steps[k]?.validate;
    if (!fn) return true;
    this.stop();
    const ctl = (this.pending = new AbortController());
    this.busy(true);
    let res: StepCheck;
    try {
      res = await fn(this.getValues(), this, ctl.signal);
    } catch (e) {
      res = String((e as Error)?.message ?? e); // a failing check is a message, not a broken wizard
    }
    if (ctl.signal.aborted) return false; // gone elsewhere (or destroyed) meanwhile
    this.pending = undefined;
    this.busy(false);
    const ok = res === true || res == null;
    this.note(k, typeof res === 'string' ? res : '');
    if (!ok && typeof res === 'object') for (const [name, msg] of Object.entries(res)) this.getField(name)?.setError(msg);
    if (!ok) this.stepper.setStepState(k, 'error');
    return ok;
  }

  /**
   * Moves to a step. Forward with `linear` validates the steps on the way (their fields, then their `validate`) and stops
   * at the first invalid one. Resolves with whether it got there; without a step `validate` on the way it moves at once.
   */
  goTo(j: number): Promise<boolean> {
    if (j < 0 || j >= this.count() || j === this.index) return Promise.resolve(false);
    if (this.pending && j > this.index) return Promise.resolve(false); // a check is running: a second Next does nothing
    this.stop(); // going back cancels it
    if (this.emit('before-step-change', this.index, j) === false) return Promise.resolve(false);
    const from = this.index;
    const land = (target: number) => {
      if (this.index !== from) return false; // the user moved on while a check was running
      if (target !== this.index) this.body.setActiveItem(target);
      if (target !== j) this.stepFields(target).find((f) => f.getError())?.focus();
      return target === j;
    };
    if (this.cfg().linear === false || j < from) return Promise.resolve(land(j));
    const walk = (k: number): boolean | Promise<boolean> => {
      for (; k < j; k++) {
        if (!this.validateStep(k)) return land(k);
        if (this.cfg().steps[k]?.validate) return this.check(k).then((ok) => (ok ? walk(k + 1) : land(k)));
      }
      return land(j);
    };
    return Promise.resolve(walk(from));
  }
  next(): Promise<boolean> {
    return this.goTo(this.index + 1);
  }
  back(): Promise<boolean> {
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
    this.showNote();
    if (i !== from) {
      this.emit('step-change', i, from);
      if (this.rendered && this.el.isConnected && !this.stepFields(i).some((f) => f.getError())) {
        const panel = this.body.items[i]?.el;
        if ((this.config as StepFormConfig).autoFocus) this.stepFields(i)[0]?.focus();
        else if (panel) ((panel.tabIndex = -1), panel.focus());
      }
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

  /** What the user sees for a field (its display text; ticks for booleans, dots for passwords; one line per FieldList row). */
  private show_(f: Field<any>): string {
    const fl = f as Field<any> & { getRows?(): unknown[]; getRowFields(i: number): Field<any>[] };
    if (fl.getRows)
      return fl.getRows().map((_, i) => fl.getRowFields(i).map((x) => this.show_(x)).filter((t) => t !== '—').join(' · ')).join('\n') || '—';
    const v = f.getValue();
    if (typeof v === 'boolean') return v ? '✓' : '—';
    if ((f.config as { inputType?: string }).inputType === 'password') return v ? '••••••••' : '—';
    const text = f.getDisplayText();
    if (text) return text;
    const flat = (x: unknown): string => (Array.isArray(x) ? x.map(flat).join(', ') : x && typeof x === 'object' ? Object.values(x).map(flat).join(' – ') : `${x ?? ''}`);
    return flat(v) || '—';
  }

  /** Enter and the Finish button: Next on every step but the last; on the last, validate everything and `finish`. */
  override submit(): boolean {
    if (this.index < this.count() - 1) {
      void this.next();
      return false;
    }
    const states = () => {
      for (let i = 0; i < this.real(); i++) this.stepper.setStepState(i, this.stepFields(i).some((f) => f.getError()) ? 'error' : 'done');
    };
    // with step checks, Finish waits for them (it returns false now; `finish` fires when they pass)
    if (this.cfg().steps.some((s) => s.validate)) {
      if (this.pending || this.emit('before-submit') === false || !this.validate()) return states(), false;
      const at = this.index;
      void (async () => {
        for (let k = 0; k < this.real(); k++) {
          if (!(await this.check(k))) {
            if (this.index !== at || this.destroyed) return; // the user went back: the check was aborted
            if (k !== at) this.body.setActiveItem(k);
            this.stepFields(k).find((f) => f.getError())?.focus();
            return;
          }
        }
        states();
        const values = this.getValues();
        this.emit('submit', values);
        this.emit('finish', values);
      })();
      return false;
    }
    const ok = super.submit();
    states();
    if (ok) this.emit('finish', this.getValues());
    return ok;
  }

  /** Clears the values and goes back to the first step. */
  override reset(): void {
    this.stop();
    this.notes = [];
    super.reset();
    this.clearErrors();
    for (let i = 0; i < this.count(); i++) this.stepper.setStepState(i, 'pending');
    if (this.index !== 0) this.body.setActiveItem(0);
    this.showNote();
  }
}
register('stepform', StepForm);
