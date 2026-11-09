import { create, ui, toast, type CommandPalette } from 'optikos';

export default function palette(host: HTMLElement) {
  const commands = create<CommandPalette>({
    type: 'commandpalette',
    commands: [
      { id: 'new', title: 'New customer', category: 'Customers', icon: 'plus', shortcut: 'N', keywords: ['create', 'add'], handler: () => toast('New customer') },
      { id: 'find', title: 'Find an order', category: 'Orders', icon: 'search', handler: () => toast('Find an order') },
      { id: 'export', title: 'Export orders to CSV', category: 'Orders', icon: 'file', handler: () => toast('Exported') },
      { id: 'assign', title: 'Assign to…', category: 'Orders', icon: 'users', children: ['Ada', 'Alan', 'Grace'].map((who) => ({ id: who, title: who, handler: () => toast(`Assigned to ${who}`) })) },
    ],
  });
  const open = ui.primary('Open the palette (Ctrl+K)', () => commands.open(), { icon: 'search' });
  open.mount(host);
  return () => {
    open.destroy();
    commands.destroy();
  };
}
