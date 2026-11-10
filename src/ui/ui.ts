// Short constructors for the things you write most. They return real component instances (the classes), so they can be
// used anywhere a config goes: `items: [ui.text('name', 'Name', { required: true }), ui.select('plan', 'Plan', ['Free', 'Pro'])]`.
// The last argument is always a config object that overrides or adds anything (`{ required: true, help: '…' }`).
import { TextField, type TextFieldConfig } from '../components/fields/textfield/textfield';
import { TextArea } from '../components/fields/textarea/textarea';
import { NumberField } from '../components/fields/numberfield/numberfield';
import { DateField } from '../components/fields/datefield/datefield';
import { DateRangeField } from '../components/fields/daterangefield/daterangefield';
import { Checkbox } from '../components/fields/checkbox/checkbox';
import { Toggle } from '../components/fields/toggle/toggle';
import { CheckboxGroup } from '../components/fields/checkboxgroup/checkboxgroup';
import { RadioGroup, type RadioOption } from '../components/fields/radiogroup/radiogroup';
import { Select } from '../components/fields/select/select';
import { ComboBox } from '../components/fields/combobox/combobox';
import { SuggestField } from '../components/fields/suggestfield/suggestfield';
import { LookupField } from '../components/fields/lookupfield/lookupfield';
import { SecretField } from '../components/fields/secretfield/secretfield';
import { Slider } from '../components/fields/slider/slider';
import { Dial } from '../components/fields/dial/dial';
import { Button } from '../components/base/button/button';
import { Panel } from '../components/layout/panel/panel';
import { Toolbar } from '../components/layout/toolbar/toolbar';
import { Container } from '../core/container';
import { Form } from '../components/form/form/form';
import type { Component } from '../core/component';
import type { AnyConfig } from '../core/registry';
import type { Variant } from './enums';

type Cfg = Record<string, any>;
// anything a container takes: an instance, a declarative config ({ type: 'fieldset', ... }) or a toolbar string ('->', '-')
type Item = Component | AnyConfig | string;
type Options = (string | number | { value: unknown; label: string; disabled?: boolean })[];

const field = <T>(Cls: new (c: any) => T, name: string, label: string | undefined, c: Cfg = {}): T => new Cls({ name, label, ...c });

export const ui = {
  // ---- fields: (name, label, config?) ----
  text: (name: string, label?: string, c?: Cfg) => field(TextField, name, label, c),
  email: (name: string, label?: string, c?: Cfg) => field(TextField, name, label, { inputType: 'email', ...c } satisfies TextFieldConfig),
  password: (name: string, label?: string, c?: Cfg) => field(TextField, name, label, { inputType: 'password', ...c }),
  area: (name: string, label?: string, c?: Cfg) => field(TextArea, name, label, c),
  number: (name: string, label?: string, c?: Cfg) => field(NumberField, name, label, c),
  date: (name: string, label?: string, c?: Cfg) => field(DateField, name, label, c),
  dateRange: (name: string, label?: string, c?: Cfg) => field(DateRangeField, name, label, c),
  secret: (name: string, label?: string, c?: Cfg) => field(SecretField, name, label, c),
  slider: (name: string, label?: string, c?: Cfg) => field(Slider, name, label, c),
  dial: (name: string, label?: string, c?: Cfg) => field(Dial, name, label, c),
  /** `boxLabel` is the text beside the box. */
  check: (name: string, boxLabel?: string, c?: Cfg) => field(Checkbox, name, undefined, { boxLabel, ...c }),
  /** An on/off switch; `boxLabel` is the text beside it. */
  toggle: (name: string, boxLabel?: string, c?: Cfg) => field(Toggle, name, undefined, { boxLabel, ...c }),
  radio: (name: string, label: string, options: RadioOption[], c?: Cfg) => field(RadioGroup, name, label, { options, ...c }),
  /** Several choices; the value is the list of checked values. */
  checkGroup: (name: string, label: string, options: RadioOption[], c?: Cfg) => field(CheckboxGroup, name, label, { options, ...c }),
  select: (name: string, label: string, options: Options, c?: Cfg) => field(Select, name, label, { options, ...c }),
  combo: (name: string, label: string, options: Options, c?: Cfg) => field(ComboBox, name, label, { options, ...c }),
  suggest: (name: string, label: string, query: (text: string, o: { signal: AbortSignal }) => unknown, c?: Cfg) => field(SuggestField, name, label, { query, ...c }),
  /** `lookup` is a LookupDef or the name given to `registerLookup`. */
  lookup: (name: string, label: string, lookup: Cfg | string, c?: Cfg) => field(LookupField, name, label, { lookup, ...c }),

  // ---- actions ----
  button: (text: string, handler?: (b: Button, ev: MouseEvent) => unknown, c?: Cfg) => new Button({ text, handler, ...c }),
  primary: (text: string, handler?: (b: Button, ev: MouseEvent) => unknown, c?: Cfg) => new Button({ text, handler, variant: 'primary' satisfies Variant, ...c }),
  danger: (text: string, handler?: (b: Button, ev: MouseEvent) => unknown, c?: Cfg) => new Button({ text, handler, variant: 'danger' satisfies Variant, ...c }),

  // ---- structure ----
  row: (...items: Item[]) => new Container({ layout: 'hbox', items } as Cfg),
  col: (...items: Item[]) => new Container({ layout: 'vbox', items } as Cfg),
  /** `columns`: a number (equal columns, one column on narrow containers) or a CSS `grid-template-columns`. */
  grid: (columns: number | string, ...items: Item[]) => new Container({ layout: { type: 'grid', columns }, items } as Cfg),
  panel: (title: string, items: Item[], c?: Cfg) => new Panel({ title, items, ...c } as Cfg),
  toolbar: (...items: Item[]) => new Toolbar({ items } as Cfg),
  form: (items: Item[], c?: Cfg) => new Form({ items, ...c } as Cfg),
};
