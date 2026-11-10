import { describe, it, expect } from 'vitest';
import { create, Form, FormSection, FieldSet } from 'optikos';

describe('Form layouts', () => {
  it('Form `columns` is a responsive grid; `colspan: "full"` takes the row; `labelWidth` lines the labels up', () => {
    const f = create<Form>({ type: 'form', columns: 2, labelWidth: 140, labelPos: 'left', items: [
      { type: 'textfield', name: 'a', label: 'A' },
      { type: 'textfield', name: 'b', label: 'B' },
      { type: 'textarea', name: 'c', label: 'C', colspan: 'full' },
    ] } as any);
    expect(f.el.classList.contains('op-layout-grid')).toBe(true);
    expect(f.el.style.getPropertyValue('--op-layout-columns')).toBe('2');
    expect((f.getField('c')!.el as HTMLElement).style.gridColumn).toBe('1 / -1');
    expect(f.el.style.getPropertyValue('--op-field-label-width')).toBe('140px');
    f.setLabelWidth('10rem');
    expect(f.el.style.getPropertyValue('--op-field-label-width')).toBe('10rem');
  });

  it('FieldSet: variants, a description that describes the group, and `columns`', () => {
    const fs = create<FieldSet>({ type: 'fieldset', title: 'Address', description: 'Where we ship to', variant: 'line', columns: 2, items: [{ type: 'textfield', name: 'city' }] } as any);
    expect(fs.el.classList.contains('op-fieldset--line')).toBe(true);
    const desc = fs.el.querySelector('.op-fieldset__desc')!;
    expect(desc.textContent).toBe('Where we ship to');
    expect(fs.el.getAttribute('aria-describedby')).toBe(desc.id);
    expect(fs.getBody().classList.contains('op-layout-grid')).toBe(true);
    fs.setVariant('plain');
    expect(fs.el.classList.contains('op-fieldset--plain')).toBe(true);
    expect(fs.el.classList.contains('op-fieldset--line')).toBe(false);
    fs.setDescription('');
    expect((desc as HTMLElement).hidden).toBe(true);
    expect(fs.el.hasAttribute('aria-describedby')).toBe(false);
    fs.collapse();
    expect((desc as HTMLElement).hidden).toBe(true);
  });

  it('FormSection: a <section> named by its title and described by its description; aside or stacked', () => {
    const s = create<FormSection>({ type: 'formsection', title: 'Profile', description: 'How others see you', columns: 2, items: [{ type: 'textfield', name: 'name', label: 'Name' }] } as any);
    expect(s.el.tagName).toBe('SECTION');
    const title = s.el.querySelector('.op-formsection__title')!;
    expect(title.tagName).toBe('H3');
    expect(s.el.getAttribute('aria-labelledby')).toBe(title.id);
    expect(s.el.getAttribute('aria-describedby')).toBe(s.el.querySelector('.op-formsection__desc')!.id);
    expect(s.getBody().querySelector('.op-textfield')).not.toBeNull();
    expect(s.getBody().classList.contains('op-layout-grid')).toBe(true);
    expect(s.el.classList.contains('op-formsection--stacked')).toBe(false);
    s.setAside(false);
    expect(s.el.classList.contains('op-formsection--stacked')).toBe(true);
    s.setTitle('Account');
    expect(title.textContent).toBe('Account');
  });

  it('fields inside sections and fieldsets are the form fields (one getValues, one validate)', () => {
    const f = create<Form>({ type: 'form', items: [
      { type: 'formsection', title: 'Profile', items: [{ type: 'textfield', name: 'name', required: true }] },
      { type: 'formsection', title: 'Address', items: [{ type: 'fieldset', title: 'Street', items: [{ type: 'textfield', name: 'address.city', value: 'Porto' }] }] },
    ] } as any);
    expect(f.getValues()).toEqual({ name: '', address: { city: 'Porto' } });
    expect(f.validate()).toBe(false);
  });
});
