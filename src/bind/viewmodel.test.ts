import { describe, it, expect, afterEach } from 'vitest';
import { effect, viewModel, bindVM, bindForm } from 'optikos/bind';
import { create, Model, Form, Button, Label, Store } from 'optikos';

afterEach(() => (document.body.innerHTML = ''));

describe('viewModel', () => {
  it('reads and writes dotted paths, and effects rerun for the paths they read (or those around them)', () => {
    const vm = viewModel({ data: { user: { name: 'Ada' }, qty: 1 } });
    const seen: unknown[] = [];
    effect(() => void seen.push(vm.get('user.name')));
    vm.set('user.name', 'Grace');
    vm.set('qty', 5);
    vm.set('user', { name: 'Linus' });
    expect(seen).toEqual(['Ada', 'Grace', 'Linus']);
    expect(vm.get('qty')).toBe(5);
  });

  it('formulas depend on data and on each other, and cannot be written', () => {
    const vm = viewModel({ data: { qty: 2, price: 10 }, formulas: { total: (get) => get<number>('qty') * get<number>('price'), label: (get) => `Total ${get('total')}` } });
    const seen: unknown[] = [];
    effect(() => void seen.push(vm.get('label')));
    vm.set('qty', 3);
    vm.set('price', 20);
    expect(seen).toEqual(['Total 20', 'Total 30', 'Total 60']);
    expect(() => vm.set('total', 1)).toThrow(/formula/);
  });

  it('link: a Model is read, and a write goes through model.set (marked modified); null clears', () => {
    const vm = viewModel();
    const store = new Store({ data: [{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }] });
    const seen: unknown[] = [];
    effect(() => void seen.push(vm.get('record.name')));
    vm.link('record', store.getAt(0)!);
    vm.set('record.name', 'Ada L.');
    expect(store.getAt(0)!.get('name')).toBe('Ada L.');
    expect(store.getAt(0)!.isDirty()).toBe(true);
    vm.link('record', store.getAt(1)!);
    vm.link('record', null);
    expect(seen).toEqual([undefined, 'Ada', 'Ada L.', 'Grace', undefined]);
    void Model;
  });
});

describe('bindVM and bindForm', () => {
  it('binds setters to {path}, {!path} and templates; a field value is two-way', () => {
    const vm = viewModel({ data: { record: { name: 'Ada' }, busy: false } });
    const label = create<Label>({ type: 'label', renderTo: document.body });
    const save = create<Button>({ type: 'button', text: 'Save', renderTo: document.body });
    const name = create<any>({ type: 'textfield', renderTo: document.body });
    bindVM(label, vm, { text: 'Hello {record.name}!' });
    bindVM(save, vm, { disabled: '{busy}' });
    bindVM(name, vm, { value: '{record.name}' });
    expect(label.el.textContent).toBe('Hello Ada!');
    expect(name.getValue()).toBe('Ada');
    vm.set('busy', true);
    expect(save.el.classList.contains('is-disabled')).toBe(true);
    name.setValue('Grace');
    expect(vm.get('record.name')).toBe('Grace');
    expect(label.el.textContent).toBe('Hello Grace!');
    vm.set('record.name', 'Linus');
    expect(name.getValue()).toBe('Linus');
  });

  it('bindForm loads a linked record clean, writes edits through, and a new link is clean again', () => {
    const vm = viewModel();
    const store = new Store({ data: [{ id: 1, name: 'Ada', city: 'London' }, { id: 2, name: 'Grace', city: 'NYC' }] });
    const form = create<Form>({ type: 'form', renderTo: document.body, items: [{ type: 'textfield', name: 'name' }, { type: 'textfield', name: 'city' }] } as any);
    bindForm(form, vm, 'record');
    vm.link('record', store.getAt(0)!);
    expect(form.getValues()).toEqual({ name: 'Ada', city: 'London' });
    expect(form.isDirty()).toBe(false);
    form.getField('city')!.setValue('Paris');
    expect(store.getAt(0)!.get('city')).toBe('Paris');
    expect(form.isDirty()).toBe(true);
    vm.link('record', store.getAt(1)!);
    expect(form.getValues()).toEqual({ name: 'Grace', city: 'NYC' });
    expect(form.isDirty()).toBe(false);
    form.getField('name')!.setValue('Gracie');
    expect(form.isDirty()).toBe(true);
    expect(store.getAt(0)!.get('name')).toBe('Ada');
    vm.link('record', null);
    form.getField('name')!.setValue('nobody');
    expect(store.getAt(1)!.get('name')).toBe('Gracie');
  });
});
