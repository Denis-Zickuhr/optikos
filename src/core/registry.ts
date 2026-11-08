import type { Component, ComponentConfig } from './component';

export type ComponentClass = { new (config: any): Component<any>; type?: string };
/** Config accepted by `create` and `items`: the base keys plus whatever the chosen `type` understands. */
export type AnyConfig = ComponentConfig & Record<string, any>;

const types = new Map<string, ComponentClass>();

/** Registers a component class under a `type`. Users register their own the same way. */
export function register(type: string, cls: ComponentClass): void {
  cls.type = type;
  types.set(type, cls);
}

export const getType = (type: string): ComponentClass | undefined => types.get(type);

/** Builds a component from a config (or passes an instance through). `renderTo` mounts it. */
export function create<T extends Component = Component>(config: AnyConfig | Component): T {
  if (typeof (config as Component).render === 'function') return config as T;
  const cfg = config as AnyConfig;
  const Cls = cfg.type ? types.get(cfg.type) : undefined;
  if (!Cls) throw new Error(`Optikos: unknown component type "${cfg.type}". Did you import or register it?`);
  const cmp = new Cls(cfg) as T;
  if (cfg.renderTo) cmp.mount(cfg.renderTo);
  return cmp;
}
