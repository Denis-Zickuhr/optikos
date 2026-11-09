export type Lang = 'en' | 'pt-BR';
export interface SheetText { title: string; summary: string; fields: Record<string, string> }
export const LANGS: Lang[];
export function canonKey(key: string): string;
export function components(): { name: string; title: string; type: string | null; category: string; summary: string; fields: Record<string, string>; docs: Partial<Record<Lang, SheetText>>; examples: any[] }[];
export function guides(): { name: string; title: string; markdown: string; i18n: Partial<Record<Lang, { title: string; markdown: string }>> }[];
export function tokens(): Record<string, string>;
export function themes(): string[];
export function repo(): string;
