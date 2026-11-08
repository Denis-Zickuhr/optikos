// Shared bits of the photo demo: the app context, tiny renderers and the demo's CSS.
import type { Model } from 'optikos';
import { photos, files, posts, type Photo, type Comment, type FileRow, type Post } from './data';

export interface ShareTarget { kind: 'photo' | 'album' | 'file'; name: string }

/** What the views need from the app shell (and from each other). */
export interface Ctx {
  navigate(id: string): void;
  /** Opens the full-size viewer on a photo; `list` is what Prev/Next walk through. */
  openViewer(photo: Photo, list: Photo[]): void;
  openShare(targets: ShareTarget[]): void;
  /** Photos changed (favorite, album, delete, upload, backup…): every view redraws from the shared array. */
  photosChanged(): void;
  onPhotosChanged(fn: () => void): void;
  upload(files?: File[]): void;
  backupNow(): void;
  comments: Map<number, Comment[]>;
}

export const css = `
html,body{margin:0;height:100%}
.pg-top{background:var(--op-color-surface);border:0;border-block-end:1px solid var(--op-color-border)}
.pg-brand{font-weight:700;letter-spacing:.02em;padding-inline:var(--op-space-2)}.pg-brand span{color:var(--op-color-primary)}
.pg-side{display:flex;flex-direction:column;background:var(--op-color-surface);border-inline-end:1px solid var(--op-color-border);--op-region-drawer-width:18rem}
.pg-side .op-navmenu{flex:1}
.pg-storage{padding:var(--op-space-3) var(--op-space-4);border-block-start:1px solid var(--op-color-border);font-size:var(--op-font-size-sm);color:var(--op-color-fg-muted)}
.pg-bar{display:block;block-size:.375rem;margin-block:var(--op-space-2);background:var(--op-color-surface-2);border-radius:var(--op-radius-pill);overflow:hidden}
.pg-bar>i{display:block;block-size:100%;background:var(--op-color-primary);border-radius:inherit;transition:inline-size .4s ease}
.pg-burger{display:none}.op-layout-border.is-narrow .pg-burger{display:inline-flex}
.pg-view{padding:var(--op-space-4);gap:var(--op-space-3)!important}
.pg-head{display:flex;align-items:baseline;gap:var(--op-space-3);flex-wrap:wrap}
.pg-head h1{margin:0;font-size:var(--op-font-size-xl)}.pg-head small{color:var(--op-color-fg-muted)}
.pg-card{position:relative;display:block;aspect-ratio:4/3;overflow:hidden;border-radius:inherit;background:var(--op-color-surface-2)}
.pg-card img{display:block;inline-size:100%;block-size:100%;object-fit:cover;transition:transform .25s ease}
.op-dataview__item:hover .pg-card img{transform:scale(1.04)}
.pg-cap{position:absolute;inset-inline:0;inset-block-end:0;padding:var(--op-space-5) var(--op-space-2) var(--op-space-2);color:#fff;background:linear-gradient(transparent,rgb(0 0 0/.65));font-size:var(--op-font-size-sm);opacity:0;transition:opacity .2s}
.op-dataview__item:hover .pg-cap,.op-dataview__item:focus-visible .pg-cap,.op-dataview__item.is-selected .pg-cap{opacity:1}
.pg-heart{position:absolute;inset-block-start:var(--op-space-2);inset-inline-end:var(--op-space-2);inline-size:2rem;block-size:2rem;display:grid;place-items:center;color:#fff;background:rgb(0 0 0/.35);border:0;border-radius:50%;font-size:1.1rem;cursor:pointer;opacity:0;transition:opacity .2s}
.op-dataview__item:hover .pg-heart,.pg-heart.is-on,.op-dataview__item:focus-visible .pg-heart{opacity:1}.pg-heart.is-on{color:#ff6b81}
.pg-dot{position:absolute;inset-block-start:var(--op-space-2);inset-inline-start:var(--op-space-2);inline-size:.6rem;block-size:.6rem;border-radius:50%;box-shadow:0 0 0 2px rgb(0 0 0/.35)}
.pg-dot--synced{background:var(--op-color-success)}.pg-dot--pending{background:var(--op-color-warning)}.pg-dot--failed{background:var(--op-color-danger)}
.pg-tag{position:absolute;inset-block-end:var(--op-space-2);inset-inline-end:var(--op-space-2);padding:0 .4rem;color:#fff;background:rgb(0 0 0/.55);border-radius:var(--op-radius-sm);font-size:var(--op-font-size-sm)}
.pg-pill{display:inline-block;padding:0 .5rem;border-radius:var(--op-radius-pill);font-size:var(--op-font-size-sm);font-weight:600;line-height:1.5;white-space:nowrap}
.pg-pill--ok{color:var(--op-color-success);background:var(--op-color-success-soft)}.pg-pill--warn{color:var(--op-color-warning);background:var(--op-color-warning-soft)}.pg-pill--bad{color:var(--op-color-danger);background:var(--op-color-danger-soft)}.pg-pill--info{color:var(--op-color-info);background:var(--op-color-info-soft)}.pg-pill--muted{color:var(--op-color-fg-muted);background:var(--op-color-surface-2)}
.pg-stage{position:relative;display:grid;place-items:center;min-block-size:16rem;background:#000;border-radius:var(--op-radius)}
.pg-stage img{display:block;inline-size:100%;aspect-ratio:4/3;max-block-size:62vh;object-fit:contain;border-radius:var(--op-radius)}
.pg-stage button{position:absolute;inset-block-start:50%;transform:translateY(-50%);inline-size:2.5rem;block-size:2.5rem;color:#fff;background:rgb(255 255 255/.18);border:0;border-radius:50%;font-size:1.4rem;cursor:pointer}
.pg-stage .pg-prev{inset-inline-start:var(--op-space-2)}.pg-stage .pg-next{inset-inline-end:var(--op-space-2)}
.pg-stage figcaption{position:absolute;inset-inline:0;inset-block-end:0;padding:var(--op-space-2) var(--op-space-3);color:#fff;background:linear-gradient(transparent,rgb(0 0 0/.7));font-size:var(--op-font-size-sm)}
.pg-post{display:flex;flex-direction:column;background:var(--op-color-surface);border:1px solid var(--op-color-border);border-radius:var(--op-radius-lg);overflow:hidden;cursor:pointer}
.pg-post__head{display:flex;align-items:center;gap:var(--op-space-2);padding:var(--op-space-3)}
.pg-avatar{display:inline-grid;place-items:center;flex:none;inline-size:2.25rem;block-size:2.25rem;color:#fff;border-radius:50%;font-weight:700}
.pg-post__head small{display:block;color:var(--op-color-fg-muted)}
.pg-post img{display:block;inline-size:100%;aspect-ratio:4/3;object-fit:cover}
.pg-post p{flex:1;margin:0;padding:var(--op-space-3) var(--op-space-3) var(--op-space-1)}
.pg-post__foot{display:flex;gap:var(--op-space-3);padding:var(--op-space-2) var(--op-space-3) var(--op-space-3)}
.pg-post__foot button{font:inherit;color:var(--op-color-fg-muted);background:transparent;border:0;cursor:pointer;padding:0}.pg-post__foot button.is-on{color:#ff6b81}
.op-dataview__item.is-selected .pg-post{border-color:var(--op-color-primary)}
.pg-stat{flex:1;padding:var(--op-space-4);background:var(--op-color-surface);border:1px solid var(--op-color-border);border-radius:var(--op-radius-lg)}
.pg-stat b{display:block;font-size:1.6rem}.pg-stat span{color:var(--op-color-fg-muted);font-size:var(--op-font-size-sm)}
`;

export const pill = (text: string, tone: 'ok' | 'warn' | 'bad' | 'info' | 'muted') => Object.assign(document.createElement('span'), { className: `pg-pill pg-pill--${tone}`, textContent: text });
export const BACKUP_TONE = { synced: 'ok', pending: 'warn', failed: 'bad' } as const;
export const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] => Object.assign(document.createElement(tag), { className: cls, textContent: text });

/** A thin progress bar as plain DOM. */
export function progress(): { el: HTMLElement; set(pct: number): void } {
  const bar = el('span', 'pg-bar');
  const fill = el('i');
  fill.style.inlineSize = '0%';
  bar.append(fill);
  return { el: bar, set: (pct) => (fill.style.inlineSize = `${Math.max(0, Math.min(100, pct))}%`) };
}

export const ago = (t: number) => {
  const h = Math.max(1, Math.round((Date.UTC(2026, 10, 8, 13) - t) / 36e5));
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};
/**
 * A Store keeps its own copy of every record (`rec.data`), so what the user changes must be written to the demo's own
 * arrays: these find the original object behind a record (by id) and fall back to the copy.
 */
export const asPhoto = (rec: Model): Photo => photos.find((p) => p.id === rec.data.id) ?? (rec.data as Photo);
export const asFile = (rec: Model): FileRow => files.find((f) => f.id === rec.data.id) ?? (rec.data as FileRow);
export const asPost = (rec: Model): Post => posts.find((p) => p.id === rec.data.id) ?? (rec.data as Post);

import { register, Component, type ComponentConfig } from 'optikos';
/** Wraps a plain DOM node as a component, so it can sit inside Optikos containers next to real components. */
interface HtmlConfig extends ComponentConfig { child: Node }
class Html extends Component<HtmlConfig> {
  protected override baseCls = 'pg-html';
  protected override onRender() {
    this.el.append(this.config.child);
  }
}
register('pg-html', Html);
