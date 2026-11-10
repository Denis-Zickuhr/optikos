// The ↻ icon and its label, shared by Panel and Tabs: only components that can reload pay for them.
import { registerIcons } from '../../base/icon/icon';
import { addMessages } from '../../../core/i18n';

registerIcons({ refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"/>' });
addMessages('en', { reload: 'Reload' });
addMessages('pt-BR', { reload: 'Recarregar' });
