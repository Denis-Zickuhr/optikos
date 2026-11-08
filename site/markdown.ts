// Tiny Markdown → DOM for the guides (headings, paragraphs, lists, code fences, tables, **bold**, `code`, links). Never uses innerHTML.
const inline = (text: string, into: HTMLElement) => {
  for (const part of text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/)) {
    if (!part) continue;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (part.startsWith('`')) into.append(Object.assign(document.createElement('code'), { textContent: part.slice(1, -1) }));
    else if (part.startsWith('**')) into.append(Object.assign(document.createElement('strong'), { textContent: part.slice(2, -2) }));
    else if (link) into.append(Object.assign(document.createElement('a'), { textContent: link[1], href: link[2] }));
    else into.append(part);
  }
};
export { inline };

export function markdown(src: string): HTMLElement {
  const root = document.createElement('div');
  const lines = src.split('\n');
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text = '') => {
    const e = document.createElement(tag);
    if (text) inline(text, e);
    root.append(e);
    return e;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpExecArray | null;
    if (line.startsWith('```')) {
      const code: string[] = [];
      while (++i < lines.length && !lines[i].startsWith('```')) code.push(lines[i]);
      el('pre').append(Object.assign(document.createElement('code'), { textContent: code.join('\n') }));
    } else if ((m = /^(#{1,4})\s+(.*)/.exec(line))) el(`h${Math.min(m[1].length + 1, 5)}` as 'h2', m[2]);
    else if (line.startsWith('|') && lines[i + 1]?.includes('---')) {
      const table = el('table');
      const rows: string[][] = [];
      for (; i < lines.length && lines[i].startsWith('|'); i++) if (!/^\|[\s|:-]+\|$/.test(lines[i])) rows.push(lines[i].slice(1, -1).split(/(?<!\\)\|/).map((c) => c.trim()));
      i--;
      rows.forEach((r, n) => {
        const tr = table.appendChild(document.createElement('tr'));
        for (const c of r) inline(c, tr.appendChild(document.createElement(n ? 'td' : 'th')));
      });
    } else if (/^\s*([-*]|\d+\.)\s/.test(line)) {
      const list = el(/^\s*\d/.test(line) ? 'ol' : 'ul');
      for (; i < lines.length && /^\s*([-*]|\d+\.)\s/.test(lines[i]); i++) inline(lines[i].replace(/^\s*([-*]|\d+\.)\s/, ''), list.appendChild(document.createElement('li')));
      i--;
    } else if (line.trim()) {
      const para: string[] = [line];
      while (i + 1 < lines.length && lines[i + 1].trim() && !/^(#|```|\||\s*([-*]|\d+\.)\s)/.test(lines[i + 1])) para.push(lines[++i]);
      el('p', para.join(' '));
    }
  }
  return root;
}
