import { TextField, type TextFieldConfig } from '../textfield/textfield';
import { register } from '../../../core/registry';
import { h, clamp } from '../../../core/dom';
import { measure } from '../../../core/virtual';

export interface TextAreaConfig extends TextFieldConfig {
  rows?: number;
  autoGrow?: boolean;
  maxRows?: number;
}

export class TextArea extends TextField<string, TextAreaConfig> {
  protected override baseCls = 'op-field op-textfield op-textarea';

  protected override createInput() {
    return h('textarea', 'op-textfield__input op-textarea__input', { rows: this.config.rows ?? 3 });
  }

  protected override onKey(e: KeyboardEvent) {
    // Enter is a line break here; only Ctrl/Cmd+Enter counts as "enter".
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey) this.emit('enter', this.getValue());
      return;
    }
    super.onKey(e);
  }

  protected override onInput() {
    super.onInput();
    this.grow();
  }
  protected override applyValue(v: string) {
    super.applyValue(v);
    this.grow();
  }
  override notifyMount() {
    super.notifyMount();
    this.grow();
  }

  private grow() {
    const c = this.config;
    if (!c.autoGrow || !this.rendered) return;
    const ta = this.input as HTMLTextAreaElement;
    ta.style.height = 'auto';
    let height = ta.scrollHeight;
    if (c.maxRows) {
      const line = measure(ta, '1lh') || (ta.scrollHeight / (ta.rows || 1));
      height = Math.min(height, line * c.maxRows);
    }
    if (height) ta.style.height = `${clamp(height, 0, Infinity)}px`;
  }

  setRows(rows: number) {
    this.config.rows = rows;
    if (this.rendered) (this.input as HTMLTextAreaElement).rows = rows;
  }
}
register('textarea', TextArea);
