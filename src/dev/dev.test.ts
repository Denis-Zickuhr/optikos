import { describe, it, expect, vi, afterEach } from 'vitest';
import { create } from 'optikos';
import { enableConfigWarnings } from 'optikos/dev';

let stop = () => {};
afterEach(() => stop());

describe('optikos/dev config warnings', () => {
  it('warns once about an option the type does not know, and suggests the near one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    stop = enableConfigWarnings();
    create({ type: 'button', text: 'a', tooltips: 'x', labell: 1 });
    create({ type: 'button', text: 'b', tooltips: 'x' });
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0][0]).toContain('"button" has no option "tooltips"');
    expect(warn.mock.calls[0][0]).toContain('did you mean "tooltip"');
    warn.mockRestore();
  });

  it('knows every option a real config uses, including inherited ones (no false alarms)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    stop = enableConfigWarnings();
    create({ type: 'form', items: [{ type: 'textfield', name: 'a', label: 'A', required: true, clearable: true, validators: [] }, { type: 'lookupfield', name: 'b', lookup: { store: () => 0 as never, columns: [] }, displayFrom: 'x' }], columns: 2, renderTo: undefined });
    create({ type: 'grid', columns: [], data: [], paging: true, plugins: [], permission: 'x' });
    create({ type: 'panel', title: 't', closable: true, onReload: () => {}, tbar: [], collapsible: true });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
