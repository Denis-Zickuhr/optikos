import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create, ImageField, Form } from 'optikos';

const png = (name = 'a.png', size = 10) => new File([new Uint8Array(size)], name, { type: 'image/png' });
const revoked: string[] = [];
let n = 0;
beforeEach(() => {
  URL.createObjectURL = () => `blob:test/${++n}`;
  URL.revokeObjectURL = (u) => void revoked.push(u);
  revoked.length = 0;
});

describe('ImageField', () => {
  it('adds an image: preview, value, change; a new one replaces it; remove clears', () => {
    const f = create<ImageField>({ type: 'imagefield', label: 'Avatar', renderTo: document.body });
    const change = vi.fn();
    f.on('change', change);
    const a = png('a.png');
    f.add([a]);
    expect(f.getValue()).toBe(a);
    expect(f.el.querySelectorAll('.op-imagefield__item').length).toBe(1);
    expect(f.el.querySelector<HTMLImageElement>('.op-imagefield__img')!.getAttribute('src')).toMatch(/^blob:/);
    expect(f.el.querySelector<HTMLElement>('.op-imagefield__zone')!.hidden).toBe(true);
    expect(f.getDisplayText()).toBe('a.png');
    f.remove(0);
    expect(f.getValue()).toBeNull();
    expect(revoked.length).toBe(1);
    expect(change).toHaveBeenCalledTimes(2);
    f.destroy();
  });

  it('rejects by type, size and count, emitting reject and showing the message', () => {
    const f = create<ImageField>({ type: 'imagefield', multiple: true, maxFiles: 2, maxSize: 100, renderTo: document.body });
    const reject = vi.fn();
    f.on('reject', reject);
    const txt = new File(['x'], 'n.txt', { type: 'text/plain' });
    f.add([txt]);
    expect(reject).toHaveBeenCalledWith(txt, 'type');
    expect(f.getError()).toMatch(/n\.txt/);
    f.add([png('big.png', 500)]);
    expect(reject).toHaveBeenLastCalledWith(expect.anything(), 'size');
    f.add([png('1.png'), png('2.png'), png('3.png')]);
    expect(reject).toHaveBeenLastCalledWith(expect.anything(), 'count');
    expect((f.getValue() as File[]).map((x) => x.name)).toEqual(['1.png', '2.png']);
    expect(f.el.querySelector<HTMLElement>('.op-imagefield__zone')!.hidden).toBe(true);
    f.destroy();
  });

  it('accepts extensions, takes a saved URL, and is inert when read-only or disabled', () => {
    const f = create<ImageField>({ type: 'imagefield', accept: '.webp', value: 'https://x.test/a/cover.jpg?v=1', renderTo: document.body });
    expect(f.getDisplayText()).toBe('cover.jpg');
    f.remove(0);
    f.add([png('a.png')]);
    expect(f.getValue()).toBeNull();
    f.add([new File(['x'], 'b.WEBP', { type: '' })]);
    expect(f.getValue()).toBeInstanceOf(File);
    f.setReadonly(true);
    f.remove(0);
    expect(f.getValue()).toBeInstanceOf(File);
    f.setDisabled(true);
    f.add([new File(['x'], 'c.webp')]);
    expect((f.getValue() as File).name).toBe('b.WEBP');
    f.destroy();
  });

  it('is required inside a Form and revokes its previews on destroy', () => {
    const form = create<Form>({ type: 'form', renderTo: document.body, items: [{ type: 'imagefield', name: 'photo', label: 'Photo', required: true }] });
    expect(form.validate()).toBe(false);
    const f = form.getField('photo') as ImageField;
    f.add([png()]);
    expect(form.validate()).toBe(true);
    expect(form.getValues().photo).toBeInstanceOf(File);
    form.destroy();
    expect(revoked.length).toBe(1);
  });
});
