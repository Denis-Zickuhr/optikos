// Named values for the options that are plain strings in configs. Each is a const object plus a type of the same name,
// so `Variant.Primary` and `'primary'` are interchangeable: use whichever you like, the editor completes both.
const e = <T extends Record<string, string>>(o: T) => o;

export const Variant = e({ Default: 'default', Primary: 'primary', Danger: 'danger', Ghost: 'ghost' } as const);
export type Variant = (typeof Variant)[keyof typeof Variant];

export const LabelPos = e({ Top: 'top', Left: 'left' } as const);
export type LabelPos = (typeof LabelPos)[keyof typeof LabelPos];

export const Direction = e({ Vertical: 'vertical', Horizontal: 'horizontal' } as const);
export type Direction = (typeof Direction)[keyof typeof Direction];

/** Layout `border` regions. */
export const Region = e({ North: 'north', South: 'south', West: 'west', East: 'east', Center: 'center' } as const);
export type Region = (typeof Region)[keyof typeof Region];

/** Widget sides. */
export const Side = e({ Right: 'right', Left: 'left', Top: 'top', Bottom: 'bottom' } as const);
export type Side = (typeof Side)[keyof typeof Side];

export const LayoutKind = e({ Fit: 'fit', HBox: 'hbox', VBox: 'vbox', Border: 'border', Grid: 'grid', Card: 'card' } as const);
export type LayoutKind = (typeof LayoutKind)[keyof typeof LayoutKind];

export const Selection = e({ None: 'none', Single: 'single', Multi: 'multi' } as const);
export type Selection = (typeof Selection)[keyof typeof Selection];

export const ToastType = e({ Info: 'info', Success: 'success', Warning: 'warning', Error: 'error' } as const);
export type ToastType = (typeof ToastType)[keyof typeof ToastType];

/** Filter operators (Store.filter, FilterBuilder, lookup filters). */
export const Op = e({
  Eq: 'eq', Ne: 'ne', Contains: 'contains', NotContains: 'notContains', StartsWith: 'startsWith', EndsWith: 'endsWith',
  Gt: 'gt', Ge: 'ge', Lt: 'lt', Le: 'le', Between: 'between', NotBetween: 'notBetween', In: 'in', Nin: 'nin', Empty: 'empty', NotEmpty: 'notEmpty',
} as const);
export type Op = (typeof Op)[keyof typeof Op];

/** The shipped themes (`setTheme(ThemeName.Dark)`; add `' compact'` for the dense variant). */
export const ThemeName = e({ Light: 'light', Dark: 'dark' } as const);
export type ThemeName = (typeof ThemeName)[keyof typeof ThemeName];
