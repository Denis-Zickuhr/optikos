import { describe, it, expect, vi, afterEach } from 'vitest';
import { create, ui, Form, FieldList } from 'optikos';

afterEach(() => (document.body.innerHTML = ''));
const contacts = (extra: object = {}) => ({
  type: 'fieldlist', name: 'contacts', label: 'Contacts', min: 1, max: 3,
  items: [{ type: 'textfield', name: 'name', label: 'Name', required: true }, { type: 'textfield', name: 'email', label: 'Email' }],
  ...extra,
});
const mkForm = (extra: object = {}) => {
  const f = create<Form>({ type: 'form', items: [contacts(extra), { type: 'textfield', name: 'title', label: 'Title' }] } as any);
  document.body.append(f.el);
  return { f, list: f.getField('contacts') as FieldList };
};
const tools = (list: FieldList, i: number) => Array.from(list.getRows()[i].el.querySelectorAll<HTMLButtonElement>('.op-fieldlist__tool'));

describe('FieldList', () => {
  it('is ONE form field with an array value; the fields inside are not form fields', () => {
    const { f, list } = mkForm({ value: [{ name: 'Ada', email: 'ada@x.com' }] });
    expect(f.getFields().map((x) => x.name)).toEqual(['contacts', 'title']);
    expect(f.getValues()).toEqual({ contacts: [{ name: 'Ada', email: 'ada@x.com' }], title: '' });
    list.getRowFields(0)[1].setValue('ada@lovelace.dev');
    expect(f.getValues().contacts).toEqual([{ name: 'Ada', email: 'ada@lovelace.dev' }]);
    expect(f.isDirty()).toBe(true);
    f.reset();
    expect(f.getValues().contacts).toEqual([{ name: 'Ada', email: 'ada@x.com' }]);
    f.load({ contacts: [{ name: 'Grace' }, { name: 'Alan' }] });
    expect(list.getRows()).toHaveLength(2);
    expect(list.getValue()).toEqual([{ name: 'Grace', email: '' }, { name: 'Alan', email: '' }]);
    expect(f.isDirty()).toBe(false);
  });

  it('add / remove / move rows, with events, focus and min/max limits on the tools', () => {
    const { f, list } = mkForm({ value: [{ name: 'Ada' }] });
    expect(f.isDirty()).toBe(false); // the starting value is normalized ({ name, email: '' }) without becoming "changed"
    const added = vi.fn();
    list.on('add', added);
    const add = list.el.querySelector<HTMLButtonElement>('.op-fieldlist__add')!;
    expect(tools(list, 0).find((b) => b.dataset.act === 'flRemove')!.disabled).toBe(true); // min 1
    add.click();
    expect(added).toHaveBeenCalledWith(1);
    expect(document.activeElement).toBe(list.getRowFields(1)[0].el.querySelector('input'));
    list.getRowFields(1)[0].setValue('Grace');
    add.click();
    expect(add.disabled).toBe(true); // max 3
    list.addRow();
    expect(list.getRows()).toHaveLength(3);
    list.moveRow(1, 0);
    expect(list.getValue().map((r) => r.name)).toEqual(['Grace', 'Ada', '']);
    list.removeRow(2);
    expect(list.getValue().map((r) => r.name)).toEqual(['Grace', 'Ada']);
    expect(add.disabled).toBe(false);
    const rows = list.el.querySelectorAll('.op-fieldlist__row');
    expect(rows[1].getAttribute('role')).toBe('group');
    expect(rows[1].getAttribute('aria-label')).toBe('Contacts 2');
    expect(tools(list, 1).map((b) => b.getAttribute('aria-label'))).toEqual(['Move Contacts 2 up', 'Move Contacts 2 down', 'Remove Contacts 2']);
    expect(tools(list, 1)[1].disabled).toBe(true); // the last row cannot go down
  });

  it('before-remove can cancel; removing focuses the row that took its place', () => {
    const { list } = mkForm({ min: 0, value: [{ name: 'A' }, { name: 'B' }] });
    const off = list.on('before-remove', () => false);
    list.removeRow(0);
    expect(list.getRows()).toHaveLength(2);
    off();
    list.removeRow(0);
    expect(list.getValue().map((r) => r.name)).toEqual(['B']);
    expect(document.activeElement).toBe(list.getRowFields(0)[0].el.querySelector('input'));
    list.removeRow(0);
    expect(list.el.classList.contains('is-empty')).toBe(true);
    expect(document.activeElement).toBe(list.el.querySelector('.op-fieldlist__add'));
  });

  it('validating the form validates every row and focuses the first invalid field inside', () => {
    const { f, list } = mkForm({ value: [{ name: 'Ada' }, { name: '' }] });
    expect(f.validate()).toBe(false);
    expect(list.getRowFields(1)[0].getError()).toBeTruthy();
    expect(document.activeElement).toBe(list.getRowFields(1)[0].el.querySelector('input'));
    list.getRowFields(1)[0].setValue('Grace');
    expect(f.validate()).toBe(true);
  });

  it('reports min and required on its own error line', () => {
    const { list } = mkForm({ min: 2, required: true });
    expect(list.validate()).toBe(false);
    expect(list.getError()).toBe('This field is required');
    list.addRow({ name: 'Ada' });
    expect(list.validate()).toBe(false);
    expect(list.getError()).toBe('Add at least 2');
  });

  it('takes ui.* instances as the row template: every row gets its own fresh fields', () => {
    const f = create<Form>({ type: 'form', items: [{ type: 'fieldlist', name: 'tags', label: 'Tags', items: [ui.text('tag', 'Tag'), { type: 'inputgroup', prefix: '#', items: [ui.number('n', 'N')] }] }] } as any);
    document.body.append(f.el);
    const list = f.getField('tags') as FieldList;
    list.addRow({ tag: 'a', n: 1 });
    list.addRow({ tag: 'b' });
    expect(list.getRowFields(0)[0]).not.toBe(list.getRowFields(1)[0]);
    expect(JSON.stringify(f.getValues())).toBe(JSON.stringify({ tags: [{ tag: 'a', n: 1 }, { tag: 'b', n: null }] }));
  });
});
