import { describe, it, expect, vi, afterEach } from 'vitest';
import { create, Form, FormErrors, FormActions, Tabs } from 'optikos';

afterEach(() => (document.body.innerHTML = ''));
const mount = (cfg: object) => {
  const f = create<Form>({ type: 'form', ...cfg } as any);
  document.body.append(f.el);
  f.notifyMount();
  return f;
};

describe('showIf / enableIf', () => {
  const company = () => mount({ items: [
    { type: 'radiogroup', name: 'kind', label: 'Kind', options: ['person', 'company'], value: 'person' },
    { type: 'textfield', name: 'company', label: 'Company', required: true, showIf: (v: any) => v.kind === 'company' },
    { type: 'fieldset', title: 'Billing', showIf: (v: any) => v.kind === 'company', items: [{ type: 'textfield', name: 'vat', label: 'VAT', required: true }] },
    { type: 'checkbox', name: 'agree', boxLabel: 'I agree' },
    { type: 'button', text: 'Send', enableIf: (v: any) => v.agree === true },
  ] });

  it('a field (or a whole group) hidden by its rule does not validate and is not in getValues', () => {
    const f = company();
    expect(f.getField('company')!.isHidden()).toBe(true);
    expect((f.items[2] as any).el.hidden).toBe(true);
    expect(f.getValues()).toEqual({ kind: 'person', agree: false });
    expect(f.validate()).toBe(true); // company and vat are required, but not shown
    f.getField('kind')!.setValue('company');
    expect(f.getField('company')!.isHidden()).toBe(false);
    expect(Object.keys(f.getValues())).toEqual(['kind', 'company', 'vat', 'agree']);
    expect(f.validate()).toBe(false);
    f.getField('kind')!.setValue('person');
    expect(f.getField('company')!.getError()).toBe(''); // hidden: its error goes away with it
    expect(f.validate()).toBe(true);
  });

  it('enableIf enables and disables any item from the values', () => {
    const f = company();
    const send = f.items[4];
    expect(send.config.disabled).toBe(true);
    f.getField('agree')!.setValue(true);
    expect(send.config.disabled).toBe(false);
  });

  it('a disabled field is not validated (the user could not fix it), whatever disabled it', () => {
    const f = mount({ items: [
      { type: 'checkbox', name: 'byEmail', boxLabel: 'By email' },
      { type: 'textfield', name: 'email', label: 'Email', required: true, enableIf: (v: any) => v.byEmail === true },
      { type: 'textfield', name: 'locked', label: 'Locked', required: true, disabled: true },
    ] });
    expect(f.validate()).toBe(true);
    expect(f.isValid()).toBe(true);
    f.getField('byEmail')!.setValue(true);
    expect(f.validate()).toBe(false);
    expect(f.getField('email')!.getError()).toBeTruthy();
    expect(f.getField('locked')!.getError()).toBe('');
  });
});

describe('Form events and focusField', () => {
  it('dirty-change fires on the form when it becomes changed and clean again', () => {
    const f = mount({ items: [{ type: 'textfield', name: 'a', value: 'x' }] });
    const dirty = vi.fn();
    f.on('dirty-change', dirty);
    f.getField('a')!.setValue('y');
    f.getField('a')!.setValue('z');
    f.getField('a')!.setValue('x');
    expect(dirty.mock.calls).toEqual([[true], [false]]);
  });

  it('focusField opens the tab that holds the field', () => {
    const f = mount({ tabs: [{ title: 'One', items: [{ type: 'textfield', name: 'a' }] }, { title: 'Two', items: [{ type: 'textfield', name: 'b' }] }] });
    const tabs = f.query((c) => c instanceof Tabs)[0] as Tabs;
    f.focusField(f.getField('b')!);
    expect(tabs.getActive()).toBe(tabs.items[1]);
  });
});

describe('FormErrors', () => {
  const form = (errs: object = {}) => mount({ items: [
    { type: 'formerrors', ...errs },
    { type: 'textfield', name: 'name', label: 'Name', required: true },
    { type: 'textfield', name: 'email', label: 'Email', required: true },
  ] });

  it('stays hidden until a failed validation, lists every problem, and shrinks as they get fixed', () => {
    const f = form();
    const box = f.items[0] as FormErrors;
    expect(box.el.hidden).toBe(true);
    f.getField('name')!.setValue('x');
    f.getField('name')!.setValue('');
    expect(box.el.hidden).toBe(true); // typing alone does not open it
    f.validate();
    expect(box.el.hidden).toBe(false);
    expect(box.el.getAttribute('role')).toBe('alert');
    expect(box.el.querySelector('.op-formerrors__title')!.textContent).toBe('Fix 2 problems before saving');
    expect(Array.from(box.el.querySelectorAll('.op-formerrors__link')).map((b) => b.textContent)).toEqual(['Name: This field is required', 'Email: This field is required']);
    f.getField('name')!.setValue('Ada');
    f.getField('name')!.validate();
    expect(box.el.querySelector('.op-formerrors__title')!.textContent).toBe('Fix 1 problem before saving');
    f.getField('email')!.setValue('a@b.c');
    f.getField('email')!.validate();
    expect(box.el.hidden).toBe(true);
  });

  it('a link focuses its field and emits go; focus: true puts the focus on the summary', () => {
    const f = form({ focus: true });
    const box = f.items[0] as FormErrors;
    const go = vi.fn();
    box.on('go', go);
    f.validate();
    expect(document.activeElement).toBe(box.el);
    (box.el.querySelectorAll<HTMLElement>('.op-formerrors__link')[1]).click();
    expect(go).toHaveBeenCalledWith(f.getField('email'));
    expect(document.activeElement).toBe(f.getField('email')!.el.querySelector('input'));
  });
});

describe('FormActions', () => {
  it('Save submits, Cancel resets (cancelable), the status says when there are unsaved changes', () => {
    const f = mount({ items: [{ type: 'textfield', name: 'a', value: 'x' }, { type: 'formactions', requireChanges: true }] });
    const bar = f.items[1] as FormActions;
    expect(bar.getForm()).toBe(f);
    const [cancel, save] = Array.from(bar.el.querySelectorAll<HTMLButtonElement>('.op-button'));
    expect(save.getAttribute('type')).toBe('submit');
    expect(save.disabled).toBe(true); // requireChanges
    f.getField('a')!.setValue('y');
    expect(save.disabled).toBe(false);
    expect(bar.el.querySelector('.op-formactions__status')!.textContent).toBe('Unsaved changes');
    expect(bar.el.classList.contains('is-dirty')).toBe(true);
    const off = bar.on('cancel', () => false);
    cancel.click();
    expect(f.getValues()).toEqual({ a: 'y' });
    off();
    cancel.click();
    expect(f.getValues()).toEqual({ a: 'x' });
    expect(bar.el.querySelector('.op-formactions__status')!.textContent).toBe('');
  });

  it('setters: texts, no Cancel, sticky; extra buttons come first', () => {
    const f = mount({ items: [{ type: 'formactions', buttons: [{ text: 'Save as draft' }] }] });
    const bar = f.items[0] as FormActions;
    const texts = () => Array.from(bar.el.querySelectorAll('.op-button__text')).map((b) => b.textContent);
    expect(texts()).toEqual(['Save as draft', 'Cancel', 'Save']);
    bar.setSubmitText('Create');
    bar.setCancelText(false);
    bar.setSticky(true);
    expect(texts()).toEqual(['Save as draft', 'Create']);
    expect(bar.el.classList.contains('is-sticky')).toBe(true);
  });
});
