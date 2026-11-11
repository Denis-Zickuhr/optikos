export const getPath = (o: any, path: string): any => path.split('.').reduce((v, k) => v?.[k], o);

export function setPath(o: any, path: string, value: unknown): void {
  const keys = path.split('.');
  const last = keys.pop()!;
  keys.reduce((v, k) => (v[k] ??= {}), o)[last] = value;
}
