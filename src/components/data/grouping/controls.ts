import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import type { Model } from '../../../data/model';
import { Button } from '../../base/button/button';
import { registerIcons } from '../../base/icon/icon';
import { Menu } from '../../overlays/menu/menu';
import { addFooterGroup } from '../grid/footer';
import type { Grid } from '../grid/grid';

addMessages('en', { gcExpand: 'Expand all', gcCollapse: 'Collapse all', gcBy: 'Group by', gcNone: 'No grouping', gcActions: 'Groups' });
addMessages('pt-BR', { gcExpand: 'Expandir tudo', gcCollapse: 'Recolher tudo', gcBy: 'Agrupar por', gcNone: 'Sem agrupamento', gcActions: 'Grupos' });

registerIcons({ expand: '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>', collapse: '<path d="m7 20 5-5 5 5M7 4l5 5 5-5"/>' });

export type GroupingControl = 'expand' | 'collapse' | 'by';

/** A way to group, offered in the "Group by" menu: a record field or any function of the record. */
export interface GroupChoice {
  text: string;
  field?: string;
  by?: (rec: Model) => unknown;
}

interface Target {
  expandAll(): void;
  collapseAll(): void;
  setGroupBy(by: string | ((rec: Model) => unknown) | null): void;
}

/** Icon buttons in the grid's footer row (beside the pager): expand all, collapse all and a "Group by" menu. */
export function groupingControls(grid: Grid, target: Target, o: { expand?: boolean; collapse?: boolean; by?: boolean; choices: GroupChoice[]; current?: string }) {
  const buttons = new Map<GroupingControl, Button>();
  const group = h('div', 'op-groupcontrols op-footer-group', { role: 'group', 'aria-label': t('gcActions') });
  const add = (action: GroupingControl, icon: string, label: string, on: boolean, handler: (b: Button) => void) => {
    const b = new Button({ icon, variant: 'ghost', ariaLabel: label, tooltip: label, hidden: !on, handler: () => handler(b) });
    b.mount(group);
    buttons.set(action, b);
  };
  add('expand', 'expand', t('gcExpand'), o.expand !== false, () => target.expandAll());
  add('collapse', 'collapse', t('gcCollapse'), o.collapse !== false, () => target.collapseAll());
  let chosen = o.current ? o.choices.findIndex((c) => c.field === o.current) : -1;
  const menu = new Menu({});
  add('by', 'list', t('gcBy'), o.by !== false && o.choices.length > 0, (b) => {
    menu.setItems([
      ...o.choices.map((c, i) => ({ text: c.text, checked: chosen === i, handler: () => ((chosen = i), target.setGroupBy((c.field ?? c.by)!)) })),
      '-',
      { text: t('gcNone'), handler: () => ((chosen = -1), target.setGroupBy(null)) },
    ]);
    menu.showBy(b.el);
  });
  const leave = addFooterGroup(grid, group);
  return {
    set: (a: GroupingControl, visible: boolean) => buttons.get(a)?.[visible ? 'show' : 'hide'](),
    disable: (a: GroupingControl, disabled: boolean) => buttons.get(a)?.setDisabled(disabled),
    destroy() {
      leave();
      menu.destroy();
      buttons.forEach((b) => b.destroy());
    },
  };
}
