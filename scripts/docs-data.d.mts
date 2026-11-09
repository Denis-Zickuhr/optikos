export function components(): { name: string; title: string; type: string | null; category: string; summary: string; fields: Record<string, string>; examples: any[] }[];
export function guides(): { name: string; title: string; markdown: string }[];
export function tokens(): Record<string, string>;
export function themes(): string[];
export function repo(): string;
