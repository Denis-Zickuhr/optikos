import { describe, it, expect } from 'vitest';
import { ui, Variant, Op, Region, LayoutKind, ThemeName, create, Form, TextField, Select, Button, Container } from 'optikos';

describe('ui shortcuts and enums', () => {
  it('build real component instances with name, label and config', () => {
    const t = ui.text('email', 'Email', { required: true });
    expect(t).toBeInstanceOf(TextField);
    expect(t.name).toBe('email');
    expect(t.config.label).toBe('Email');
    expect(t.config.required).toBe(true);
    expect((ui.email('e') as TextField).config.inputType).toBe('email');
    const s = ui.select('plan', 'Plan', ['Free', 'Pro'], { value: 'Pro' });
    expect(s).toBeInstanceOf(Select);
    expect(s.getValue()).toBe('Pro');
    expect(ui.check('news', 'Subscribe').config.boxLabel).toBe('Subscribe');
  });

  it('config overrides the shortcut defaults', () => {
    expect(ui.password('p', 'Pass', { inputType: 'text' }).config.inputType).toBe('text');
  });

  it('works inside containers and forms (instances are valid items)', () => {
    const form = ui.form([ui.text('name', 'Name', { required: true }), ui.row(ui.button('A'), ui.primary('B')), ui.grid(2, ui.number('n', 'N'), ui.date('d', 'D'))]);
    // a numeric column count stays numeric, so the grid layout can collapse it to one column on narrow containers
    expect((form.items[2] as Container).config.layout).toEqual({ type: 'grid', columns: 2 });
    expect(form).toBeInstanceOf(Form);
    form.mount(document.body);
    expect(form.getFields().map((f) => f.name)).toEqual(['name', 'n', 'd']);
    expect(form.validate()).toBe(false);
    expect(document.querySelectorAll('.op-button--primary').length).toBe(1);
    form.setValues({ name: 'Ada' });
    expect(form.validate()).toBe(true);
    form.destroy();
  });

  it('button takes the handler as the second argument', () => {
    let n = 0;
    const b = ui.primary('Go', () => n++);
    expect(b).toBeInstanceOf(Button);
    b.mount(document.body);
    b.click();
    expect(n).toBe(1);
    b.destroy();
  });

  it('layout helpers', () => {
    expect(ui.col()).toBeInstanceOf(Container);
    expect(ui.panel('T', []).config.title).toBe('T');
    expect(ui.toolbar().config).toBeDefined();
  });

  it('enums are the plain strings, so both spellings mix freely', () => {
    expect(Variant.Primary).toBe('primary');
    expect(Op.NotContains).toBe('notContains');
    expect(Region.Center).toBe('center');
    expect(LayoutKind.HBox).toBe('hbox');
    expect(ThemeName.Dark).toBe('dark');
    const b = create({ type: 'button', text: 'x', variant: Variant.Danger });
    b.mount(document.body);
    expect(b.el.classList.contains('op-button--danger')).toBe(true);
    b.destroy();
  });
});
