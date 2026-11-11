import { Window } from '../window/window';
import { Label } from '../../base/label/label';
import { TextField } from '../../fields/textfield/textfield';
import { Container } from '../../../core/container';
import { Icon } from '../../base/icon/icon';
import { t } from '../../../core/i18n';
import type { Validator } from '../../../core/validators';

export interface MessageBoxButton {
  id: string;
  text: string;
  variant?: 'default' | 'primary' | 'danger';
}

export interface MessageBoxConfig {
  text: string;
  title?: string;
  icon?: string;
  buttons: MessageBoxButton[];
  /** Resolved when closed with Esc or the close button. */
  cancelId?: string;
  /** Adds a text input; `show` then resolves with the button id and the input is read by `prompt`. */
  input?: { value?: string; placeholder?: string; validators?: Validator<string>[]; autoFocus?: boolean };
  /** Called with the pressed button id before closing; return `false` to keep the dialog open. */
  beforeClose?: (id: string, win: Window, input?: TextField) => boolean | void;
  /** Dim the page behind. Default false: a message is still modal, but it does not darken the screen. */
  mask?: boolean;
}

function open(cfg: MessageBoxConfig): Promise<string> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (id: string) => {
      if (done) return;
      done = true;
      resolve(id);
    };
    const field = cfg.input ? new TextField({ value: cfg.input.value ?? '', placeholder: cfg.input.placeholder, validators: cfg.input.validators, ariaLabel: cfg.text }) : undefined;
    const message = new Label({ text: cfg.text, flex: 1 });
    const win: Window = new Window({
      title: cfg.title,
      cls: 'op-messagebox',
      closeAction: 'destroy',
      mask: cfg.mask ?? false,
      autoFocus: !!cfg.input?.autoFocus,
      items: [
        new Container({
          layout: { type: 'hbox', gap: 12, align: 'flex-start' },
          items: [...(cfg.icon ? [new Icon({ name: cfg.icon, cls: 'op-messagebox__icon' })] : []), new Container({ layout: { type: 'vbox' }, flex: 1, items: [message, ...(field ? [field] : [])] })],
        }),
      ],
      buttons: cfg.buttons.map((b) => ({
        text: b.text,
        variant: b.variant ?? 'default',
        handler: () => {
          if (cfg.beforeClose?.(b.id, win, field) === false) return;
          finish(b.id);
          win.close();
        },
      })),
    });
    win.el.setAttribute('role', cfg.input ? 'dialog' : 'alertdialog');
    win.el.setAttribute('aria-describedby', message.id);
    win.on('close', () => finish(cfg.cancelId ?? cfg.buttons[cfg.buttons.length - 1].id));
    const primary = cfg.buttons.find((b) => b.variant === 'primary' || b.variant === 'danger');
    field?.on('enter', () => (win.el.querySelectorAll('.op-panel__footer button')[cfg.buttons.indexOf(primary ?? cfg.buttons[0])] as HTMLElement).click());
    win.show();
    // the primary action takes the initial focus unless there is an input
    if (!field) win.el.querySelector<HTMLElement>('.op-panel__footer .op-button--primary, .op-panel__footer .op-button--danger')?.focus();
  });
}

export interface AlertOptions {
  title?: string;
  mask?: boolean;
  okText?: string;
  icon?: string;
}
export interface ConfirmOptions {
  title?: string;
  mask?: boolean;
  okText?: string;
  cancelText?: string;
  danger?: boolean;
  icon?: string;
}
export interface PromptOptions {
  title?: string;
  mask?: boolean;
  value?: string;
  placeholder?: string;
  okText?: string;
  cancelText?: string;
  validators?: Validator<string>[];
  /** Focus the text field on open (a phone keyboard pops up). Default false: the dialog gets the focus. */
  autoFocus?: boolean;
}

export const MessageBox = {
  show: open,

  async alert(text: string, o: AlertOptions = {}): Promise<void> {
    await open({ text, title: o.title, mask: o.mask, icon: o.icon ?? 'info', buttons: [{ id: 'ok', text: o.okText ?? t('ok'), variant: 'primary' }], cancelId: 'ok' });
  },

  async confirm(text: string, o: ConfirmOptions = {}): Promise<boolean> {
    const id = await open({
      text,
      title: o.title,
      mask: o.mask,
      icon: o.icon ?? (o.danger ? 'alert' : 'info'),
      buttons: [
        { id: 'cancel', text: o.cancelText ?? t('cancel') },
        { id: 'ok', text: o.okText ?? t('ok'), variant: o.danger ? 'danger' : 'primary' },
      ],
      cancelId: 'cancel',
    });
    return id === 'ok';
  },

  /** Resolves with the text, or `null` when cancelled. The dialog stays open while the validators fail. */
  async prompt(text: string, o: PromptOptions = {}): Promise<string | null> {
    let value: string | null = null;
    const id = await open({
      text,
      title: o.title,
      mask: o.mask,
      input: { value: o.value, placeholder: o.placeholder, validators: o.validators, autoFocus: o.autoFocus },
      buttons: [
        { id: 'cancel', text: o.cancelText ?? t('cancel') },
        { id: 'ok', text: o.okText ?? t('ok'), variant: 'primary' },
      ],
      cancelId: 'cancel',
      beforeClose: (btn, _win, field) => {
        if (btn !== 'ok') return;
        if (!field!.validate()) return false;
        value = field!.getValue();
      },
    });
    return id === 'ok' ? value : null;
  },
};

Window.ask = (text, o) => MessageBox.confirm(text, { danger: true, ...o });
