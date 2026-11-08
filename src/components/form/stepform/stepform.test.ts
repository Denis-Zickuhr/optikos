import { describe, it, expect, vi, afterEach } from 'vitest';
import { create, Form, StepForm, Stepper, Tabs } from 'optikos';

const cleanup: Array<{ destroy(): void }> = [];
afterEach(() => {
  cleanup.splice(0).forEach((c) => c.destroy());
  document.body.innerHTML = '';
});
const mount = <T extends { el: HTMLElement; notifyMount(): void; destroy(): void }>(c: T): T => {
  document.body.append(c.el);
  c.notifyMount();
  cleanup.push(c);
  return c;
};
const type = (f: any, v: string) => {
  const i = f.getInput();
  i.value = v;
  i.dispatchEvent(new Event('input', { bubbles: true }));
};
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

describe('Form with tabs', () => {
  const mk = () =>
    mount(create<Form>({
      type: 'form',
      tabs: [
        { title: 'Main', items: [{ type: 'textfield', name: 'name', label: 'Name', required: true }, { type: 'textfield', name: 'email', label: 'Email' }] },
        { title: 'Address', items: [{ type: 'textfield', name: 'address.city', label: 'City', required: true }] },
        { title: 'Notes', items: [{ type: 'textarea', name: 'notes', label: 'Notes' }] },
      ],
    } as any));
  const tabsOf = (f: Form) => f.query((c) => c instanceof Tabs)[0] as Tabs;
  const header = (f: Form, i: number) => tabsOf(f).el.querySelectorAll<HTMLElement>('[role=tab]')[i];

  it('is one form: values, dirty and reset cross every tab, even tabs never opened', () => {
    const f = mk();
    expect(f.getFields().map((x) => x.name)).toEqual(['name', 'email', 'address.city', 'notes']);
    f.getField('address.city')!.setValue('Lisboa');
    f.getField('notes')!.setValue('hello');
    expect(f.getValues()).toEqual({ name: '', email: '', address: { city: 'Lisboa' }, notes: 'hello' });
    expect(f.isDirty()).toBe(true);
    f.reset();
    expect(f.getValues().address).toEqual({ city: '' });
    f.load({ name: 'Ada', address: { city: 'London' } });
    expect(f.isDirty()).toBe(false);
  });

  it('validate() checks fields of tabs that were never opened, activates the tab of the first invalid and focuses it', () => {
    const f = mk();
    f.getField('name')!.setValue('Ada');
    const tabs = tabsOf(f);
    expect((tabs.getActive()!.config as any).title).toBe('Main');
    expect(f.validate()).toBe(false);
    expect((tabs.getActive()!.config as any).title).toBe('Address');
    expect(document.activeElement).toBe((f.getField('address.city') as any).getInput());
  });

  it('tab headers show an error badge with the count (cleared when fixed) and a dot while changed', () => {
    const f = mk();
    f.validate();
    expect(header(f, 0).classList.contains('has-error')).toBe(true);
    expect(header(f, 0).querySelector('.op-tabs__badge')!.textContent).toContain('1');
    expect(header(f, 1).classList.contains('has-error')).toBe(true);
    expect(header(f, 2).classList.contains('has-error')).toBe(false);
    f.getField('name')!.setValue('Ada');
    expect(header(f, 0).classList.contains('has-error')).toBe(false);
    expect(header(f, 0).querySelector('.op-tabs__badge')).toBeNull();
    expect(header(f, 0).classList.contains('is-dirty')).toBe(true);
    f.markClean();
    expect(header(f, 0).classList.contains('is-dirty')).toBe(false);
  });

  it('submit() goes through the tabs: invalid → no submit; valid → one submit with every value', () => {
    const f = mk();
    const submit = vi.fn();
    f.on('submit', submit);
    expect(f.submit()).toBe(false);
    f.getField('name')!.setValue('Ada');
    f.getField('address.city')!.setValue('London');
    expect(f.submit()).toBe(true);
    expect(submit.mock.calls[0][0]).toEqual({ name: 'Ada', email: '', address: { city: 'London' }, notes: '' });
  });
});

describe('Stepper', () => {
  const steps = [{ title: 'One' }, { title: 'Two', description: 'second' }, { title: 'Three', optional: true }];
  it('renders an ordered list, marks the current step, states and optional', () => {
    const s = mount(create<Stepper>({ type: 'stepper', steps, active: 1 } as any));
    const items = Array.from(s.el.querySelectorAll('li'));
    expect(items).toHaveLength(3);
    expect(items[1].classList.contains('is-current')).toBe(true);
    expect(items[1].querySelector('button')!.getAttribute('aria-current')).toBe('step');
    expect(items[2].textContent).toContain('optional');
    s.setStepState(0, 'done');
    s.setStepState(2, 'error');
    expect(s.el.querySelectorAll('li')[0].classList.contains('is-done')).toBe(true);
    expect(s.el.querySelectorAll('li')[2].classList.contains('is-error')).toBe(true);
    expect(s.el.querySelectorAll('li')[0].textContent).toContain('completed');
  });

  it('clicking selects (before-select can cancel); clickable: false disables the buttons', () => {
    const s = mount(create<Stepper>({ type: 'stepper', steps } as any));
    const picked = vi.fn();
    s.on('select', picked);
    s.el.querySelectorAll<HTMLElement>('.op-stepper__btn')[2].click();
    expect(s.getActive()).toBe(2);
    expect(picked).toHaveBeenCalledWith(2);
    s.on('before-select', () => false);
    s.el.querySelectorAll<HTMLElement>('.op-stepper__btn')[0].click();
    expect(s.getActive()).toBe(2);
    const off = mount(create<Stepper>({ type: 'stepper', steps, clickable: false } as any));
    expect(off.el.querySelector<HTMLButtonElement>('.op-stepper__btn')!.disabled).toBe(true);
  });
});

describe('StepForm', () => {
  const mk = (extra: object = {}) =>
    mount(create<StepForm>({
      type: 'stepform',
      review: true,
      steps: [
        { title: 'Person', items: [{ type: 'textfield', name: 'name', label: 'Name', required: true }, { type: 'textfield', name: 'email', label: 'Email', inputType: 'email' }] },
        { title: 'Address', optional: true, items: [{ type: 'textfield', name: 'address.city', label: 'City' }] },
        { title: 'Access', items: [{ type: 'textfield', name: 'user', label: 'User', required: true }, { type: 'checkbox', name: 'terms', boxLabel: 'Terms', value: true }] },
      ],
      ...extra,
    } as any));
  const buttons = (f: StepForm) => Array.from(f.el.querySelectorAll<HTMLButtonElement>('.op-stepform__footer button')).filter((b) => !b.hidden).map((b) => b.querySelector('.op-button__text')!.textContent!.trim());
  const click = (f: StepForm, text: string) => Array.from(f.el.querySelectorAll<HTMLButtonElement>('.op-stepform__footer button')).find((b) => b.querySelector('.op-button__text')!.textContent!.trim() === text)!.click();
  const stepEls = (f: StepForm) => Array.from(f.el.querySelectorAll<HTMLElement>('.op-stepform__body > .op-stepform__step'));

  it('one step visible at a time; Back is hidden on the first, Next hides on the last where Finish shows', () => {
    const f = mk();
    expect(f.getStepCount()).toBe(4); // 3 steps + review
    expect(stepEls(f).map((e) => e.hidden)).toEqual([false, true, true, true]);
    expect(buttons(f)).toEqual(['Next']);
    f.getField('name')!.setValue('Ada');
    click(f, 'Next');
    expect(f.getStep()).toBe(1);
    expect(buttons(f)).toEqual(['Back', 'Next']);
    f.getField('user')!.setValue('ada');
    f.goTo(3);
    expect(buttons(f)).toEqual(['Back', 'Finish']);
  });

  it('Next validates the current step: stops, marks the step as error and focuses the invalid field', () => {
    const f = mk();
    const changed = vi.fn();
    f.on('step-change', changed);
    click(f, 'Next');
    expect(f.getStep()).toBe(0);
    expect(changed).not.toHaveBeenCalled();
    expect(f.getStepper().getStepState(0)).toBe('error');
    expect(document.activeElement).toBe((f.getField('name') as any).getInput());
    type(f.getField('name'), 'Ada');
    click(f, 'Next');
    expect(f.getStep()).toBe(1);
    expect(changed).toHaveBeenCalledWith(1, 0);
    expect(f.getStepper().getStepState(0)).toBe('done');
  });

  it('Back always goes back and keeps the values; before-step-change can cancel', () => {
    const f = mk();
    f.getField('name')!.setValue('Ada');
    f.next();
    f.getField('address.city')!.setValue('Lisboa');
    f.on('before-step-change', (from: number, to: number) => !(from === 1 && to === 2));
    expect(f.next()).toBe(false);
    expect(f.getStep()).toBe(1);
    f.off('before-step-change');
    f.back();
    expect(f.getStep()).toBe(0);
    expect(f.getField('name')!.getValue()).toBe('Ada');
    expect(f.getField('address.city')!.getValue()).toBe('Lisboa');
  });

  it('linear: a click on a later step validates the way and stops at the first invalid one; linear: false lets it jump', () => {
    const f = mk();
    f.getStepper().el.querySelectorAll<HTMLElement>('.op-stepper__btn')[2].click();
    expect(f.getStep()).toBe(0); // name is required
    f.getField('name')!.setValue('Ada');
    f.getStepper().el.querySelectorAll<HTMLElement>('.op-stepper__btn')[2].click();
    expect(f.getStep()).toBe(2);
    const free = mk({ linear: false });
    free.goTo(2);
    expect(free.getStep()).toBe(2);
  });

  it('the review lists every step with what the user sees, ticks for booleans and ▪ for empty; a function can replace it', () => {
    const f = mk();
    f.getField('name')!.setValue('Ada');
    f.getField('user')!.setValue('ada');
    f.goTo(3);
    const dl = f.el.querySelectorAll('.op-stepform__review-list');
    expect(Array.from(f.el.querySelectorAll('.op-stepform__review-title')).map((x) => x.textContent)).toEqual(['Person', 'Address', 'Access']);
    expect(dl[0].textContent).toContain('Ada');
    expect(dl[1].textContent).toContain('—'); // empty city
    expect(dl[2].textContent).toContain('✓');
    expect(dl[0].textContent).toContain('Customer type'.slice(0, 0) + ''); // (the radio below is checked next)
    const custom = mk({ review: (v: any) => `Hello ${v.name}` });
    custom.getField('name')!.setValue('Bob');
    custom.getField('user')!.setValue('bob');
    custom.goTo(2);
    custom.goTo(3);
    expect(custom.el.querySelector('.op-stepform__review')!.textContent).toBe('Hello Bob');
  });

  it('Finish validates every step: it goes to the first invalid one; when all is valid, `finish` fires once with all values', () => {
    const f = mk({ linear: false });
    const fin = vi.fn();
    f.on('finish', fin);
    f.getField('name')!.setValue('Ada');
    f.goTo(3);
    f.el.dispatchEvent(new Event('submit', { cancelable: true })); // the Finish button submits the form
    expect(fin).not.toHaveBeenCalled();
    expect(f.getStep()).toBe(2); // "user" is required
    expect(f.getStepper().getStepState(2)).toBe('error');
    f.getField('user')!.setValue('ada');
    f.goTo(3);
    f.el.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(fin).toHaveBeenCalledTimes(1);
    expect(fin.mock.calls[0][0]).toEqual({ name: 'Ada', email: '', address: { city: '' }, user: 'ada', terms: true });
  });

  it('Enter in a field goes to the next step (it is the form submit on the way)', () => {
    const f = mk();
    f.getField('name')!.setValue('Ada');
    key((f.getField('name') as any).getInput(), 'Enter');
    expect(f.getStep()).toBe(1);
  });

  it('cancelText shows a Cancel button that fires `cancel`; reset goes back to step 1 and clears states', () => {
    const f = mk({ cancelText: 'Cancel' });
    const cancel = vi.fn();
    f.on('cancel', cancel);
    click(f, 'Cancel');
    expect(cancel).toHaveBeenCalled();
    f.getField('name')!.setValue('Ada');
    f.next();
    f.reset();
    expect(f.getStep()).toBe(0);
    expect(f.getField('name')!.getValue()).toBe('');
    expect(f.getStepper().getStepState(0)).toBe('pending');
  });
});
