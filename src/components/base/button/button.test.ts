import { describe, it, expect, vi } from 'vitest';
import { create, Button } from 'optikos';

const make = (cfg: object = {}) => create<Button>({ type: 'button', text: 'Save', ...cfg });

describe('Button', () => {
  it('renders text, icon and variant; setters update the DOM', () => {
    const b = make({ icon: 'plus', variant: 'primary' });
    expect(b.el.tagName).toBe('BUTTON');
    expect((b.el as HTMLButtonElement).type).toBe('button');
    expect(b.el.querySelector('.op-button__text')?.textContent).toBe('Save');
    expect(b.el.querySelector('.op-icon svg')).not.toBeNull();
    expect(b.el.classList.contains('op-button--primary')).toBe(true);
    b.setText('Go');
    b.setVariant('danger');
    b.setIcon('');
    expect(b.el.querySelector('.op-button__text')?.textContent).toBe('Go');
    expect(b.el.classList.contains('op-button--danger')).toBe(true);
    expect(b.el.querySelector('.op-icon')).toBeNull();
  });

  it('fires click + handler and honors cancellation', () => {
    const handler = vi.fn();
    const b = make({ handler });
    const click = vi.fn();
    b.on('click', click);
    b.click();
    expect(click).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(b, expect.any(MouseEvent));
    b.on('click', () => false);
    const ev = new MouseEvent('click', { cancelable: true, bubbles: true });
    b.el.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  it('does nothing while disabled or loading', () => {
    const handler = vi.fn();
    const b = make({ handler });
    b.setDisabled(true);
    expect((b.el as HTMLButtonElement).disabled).toBe(true);
    b.click();
    b.setDisabled(false);
    b.setLoading(true);
    expect(b.el.getAttribute('aria-busy')).toBe('true');
    b.click();
    expect(handler).not.toHaveBeenCalled();
    b.setLoading(false);
    expect(b.el.classList.contains('is-loading')).toBe(false);
    b.click();
    expect(handler).toHaveBeenCalledOnce();
  });

  it('toggle sets aria-pressed and emits toggle', () => {
    const b = make({ toggle: true });
    const on = vi.fn();
    b.on('toggle', on);
    expect(b.el.getAttribute('aria-pressed')).toBe('false');
    b.click();
    expect(b.el.getAttribute('aria-pressed')).toBe('true');
    expect(on).toHaveBeenCalledWith(true);
    b.setPressed(false);
    expect(b.el.classList.contains('is-pressed')).toBe(false);
  });

  it('submit button submits its form', () => {
    const form = document.createElement('form');
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    form.addEventListener('submit', onSubmit);
    const b = make({ htmlType: 'submit' });
    form.append(b.el);
    document.body.append(form);
    b.click();
    expect(onSubmit).toHaveBeenCalled();
    form.remove();
  });

  it('theme config scopes tokens to the component', () => {
    const b = make({ theme: { radius: '0', primaryBg: 'red' } });
    expect(b.el.style.getPropertyValue('--op-button-radius')).toBe('0');
    expect(b.el.style.getPropertyValue('--op-button-primary-bg')).toBe('red');
  });

  describe('stableSize', () => {
    it('keeps both faces in the DOM (normal + loading) so CSS can size to the wider one', () => {
      const b = make({ icon: 'plus', loadingText: 'Saving…' });
      expect(b.el.classList.contains('op-stable')).toBe(true);
      const face = b.el.querySelector('.op-button__face')!;
      const busy = b.el.querySelector('.op-button__busy')!;
      expect(face.querySelector('.op-button__text')!.textContent).toBe('Save');
      expect(face.querySelector('.op-icon')).not.toBeNull();
      expect(busy.querySelector('.op-spinner')).not.toBeNull();
      expect(busy.querySelector('.op-button__busy-text')!.textContent).toBe('Saving…');
      // CSS visibility hides the inactive face from assistive tech too; only the spinner is decorative
      expect(busy.hasAttribute('aria-hidden')).toBe(false);
      expect(busy.querySelector('.op-spinner')!.getAttribute('aria-hidden')).toBe('true');
      // state toggles only a class: the structure (and so the size) is identical before and after
      const before = b.el.innerHTML;
      b.setLoading(true);
      expect(b.el.innerHTML).toBe(before);
      expect(b.el.classList.contains('is-loading')).toBe(true);
      expect(b.el.getAttribute('aria-busy')).toBe('true');
      expect(b.el.getAttribute('aria-disabled')).toBe('true');
      b.setLoading(false);
      expect(b.el.innerHTML).toBe(before);
    });

    it('stableSize:false drops the class; setStableSize toggles it', () => {
      const b = make({ stableSize: false });
      expect(b.el.classList.contains('op-stable')).toBe(false);
      b.setStableSize(true);
      expect(b.el.classList.contains('op-stable')).toBe(true);
    });

    it('loading text defaults to the text and follows setText; a string passed to loading sets it', () => {
      const b = make();
      expect(b.el.querySelector('.op-button__busy-text')!.textContent).toBe('Save');
      b.setText('Send');
      expect(b.el.querySelector('.op-button__busy-text')!.textContent).toBe('Send');
      b.setLoading('Sending…');
      expect(b.el.querySelector('.op-button__busy-text')!.textContent).toBe('Sending…');
      expect(b.el.querySelector('.op-button__text')!.textContent).toBe('Send');
    });
  });
});
