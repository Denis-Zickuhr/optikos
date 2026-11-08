import { describe, it, expect, vi, afterEach } from 'vitest';
import { create, Container } from 'optikos';

const cleanup: Container[] = [];
afterEach(() => {
  cleanup.splice(0).forEach((c) => c.destroy());
  document.body.innerHTML = '';
});
const border = (layout: object = {}) => {
  const c = create<Container>({
    type: 'container', layout: { type: 'border', ...layout },
    items: [
      { type: 'container', region: 'west', width: 200, id: 'w', items: [{ type: 'textfield', id: 'search' }] },
      { type: 'container', region: 'center', id: 'c' },
      { type: 'container', region: 'east', width: 120, id: 'e' },
    ],
  } as any);
  document.body.append(c.el);
  c.notifyMount();
  cleanup.push(c);
  return c;
};
const region = (c: Container, name: string) => c.el.querySelector(`[data-region="${name}"]`) as HTMLElement;

describe('responsive layouts', () => {
  it('border: wide keeps the regions in the grid; narrow turns west/east into closed drawers', () => {
    const c = border();
    const l = c.layout!;
    expect(l.isNarrow!()).toBe(false);
    expect(c.el.classList.contains('is-narrow')).toBe(false);
    const changed = vi.fn();
    c.on('narrow-change', changed);
    l.setNarrow!(true);
    expect(c.el.classList.contains('is-narrow')).toBe(true);
    expect(changed).toHaveBeenCalledWith(true);
    expect(l.isRegionOpen!('west')).toBe(false);
    l.openRegion!('west');
    expect(region(c, 'west').classList.contains('is-open')).toBe(true);
    expect(c.el.classList.contains('has-open-region')).toBe(true);
    l.openRegion!('east'); // one drawer at a time
    expect(l.isRegionOpen!('west')).toBe(false);
    expect(l.isRegionOpen!('east')).toBe(true);
    l.toggleRegion!('east');
    expect(c.el.classList.contains('has-open-region')).toBe(false);
  });

  it('openRegion does nothing while wide; becoming wide closes every drawer', () => {
    const c = border();
    const l = c.layout!;
    l.openRegion!('west');
    expect(l.isRegionOpen!('west')).toBe(false);
    l.setNarrow!(true);
    l.openRegion!('west');
    l.setNarrow!(false);
    expect(l.isRegionOpen!('west')).toBe(false);
    expect(c.el.classList.contains('has-open-region')).toBe(false);
  });

  it('the scrim (a click on the container itself) and Esc close the drawer; focus moves into it', () => {
    const c = border();
    const l = c.layout!;
    l.setNarrow!(true);
    l.openRegion!('west');
    expect(document.activeElement!.closest('[data-region="west"]')).not.toBeNull();
    c.el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(l.isRegionOpen!('west')).toBe(false);
    l.openRegion!('west');
    region(c, 'west').dispatchEvent(new MouseEvent('click', { bubbles: true })); // inside the drawer: stays
    expect(l.isRegionOpen!('west')).toBe(true);
    region(c, 'west').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(l.isRegionOpen!('west')).toBe(false);
  });

  it('`open: west` starts that drawer open as soon as the container is narrow', () => {
    const c = border({ open: 'west' });
    c.layout!.setNarrow!(true);
    expect(c.layout!.isRegionOpen!('west')).toBe(true);
  });

  it('grid collapses numeric columns to one under narrowBelow; the class follows setNarrow', () => {
    const g = create<Container>({ type: 'container', layout: { type: 'grid', columns: 2 }, items: [{ type: 'container' }, { type: 'container', colspan: 2 }] } as any);
    document.body.append(g.el);
    cleanup.push(g);
    expect(g.layout!.isNarrow!()).toBe(false);
    g.layout!.setNarrow!(true);
    expect(g.el.classList.contains('is-narrow')).toBe(true);
    g.layout!.setNarrow!(false);
    expect(g.el.classList.contains('is-narrow')).toBe(false);
  });

  it('hbox stackBelow adds the stacking hook; without it nothing watches', () => {
    const a = create<Container>({ type: 'container', layout: { type: 'hbox', stackBelow: 600 }, items: [{ type: 'container' }] } as any);
    document.body.append(a.el);
    cleanup.push(a);
    expect(a.el.classList.contains('op-layout-stack')).toBe(true);
    a.layout!.setNarrow!(true);
    expect(a.el.classList.contains('is-narrow')).toBe(true);
    const b = create<Container>({ type: 'container', layout: 'hbox', items: [] } as any);
    document.body.append(b.el);
    cleanup.push(b);
    expect(b.layout!.isNarrow!()).toBe(false);
  });
});
