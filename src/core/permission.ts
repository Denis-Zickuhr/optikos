export type PermissionMode = 'hide' | 'disable';

let resolver: ((permission: string) => boolean) | undefined;
let mode: PermissionMode = 'hide';

/** The app's answer to "may the user do this?". Without one, every `permission` is granted. */
export function setPermissionResolver(fn: ((permission: string) => boolean) | undefined): void {
  resolver = fn;
}

/** What a component without access does by default: `hide` (default) or `disable`. A component's `permissionMode` wins. */
export function setPermissionMode(m: PermissionMode): void {
  mode = m;
}

export const allowed = (permission?: string): boolean => !permission || !resolver || resolver(permission);
export const permissionMode = (): PermissionMode => mode;

/** Applies each item's `permission` to a list: denied items are dropped (`hide`) or come back `disabled` (`disable`). Nested `items` too. */
export function gate<T extends { permission?: string }>(list: T[] | undefined): T[] | undefined {
  return list?.flatMap((i) => {
    const sub = (i as { items?: T[] }).items;
    if (allowed(i.permission)) return [sub ? { ...i, items: gate(sub) } : i];
    return mode === 'hide' ? [] : [{ ...i, disabled: sub ? () => true : true }];
  });
}
