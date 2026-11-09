# Chip  (type: 'chip')
Propósito:     Um token compacto: um filtro que o usuário liga e desliga, uma tag que ele remove, uma sugestão que ele clica.
Anatomia:      `span.op-chip` (`is-selected`, `is-disabled`) > `button.op-chip__main` (ícone + `.op-chip__text`) e, quando `removable`, `button.op-chip__remove` (×).
Config:        `text`, `icon`, `selectable: false` (o clique alterna), `selected: false`, `removable: false`, `disabled`, `handler(chip)`.
API:           `setText`, `setSelected(ligado, notificar?)`, `isSelected()`, `setDisabled`, `focus()` (o botão principal).
Eventos:       `click(chip)`, `change(selecionado)` (selecionável), `remove(chip)` (o × ou Delete/Backspace; o app remove o chip).
Estados:       `is-selected`, `is-disabled`.
Teclado/ARIA:  botões de verdade: Tab, Enter/Espaço. Um chip selecionável é um botão alternável (`aria-pressed`). O × é outro botão, chamado "Remover <texto>" (localizado); Delete ou Backspace no chip também o removem.
Tokens:        `--op-chip-fg/bg/border/radius/height`, `--op-chip-hover-border`, `--op-chip-selected-fg/bg/border`.
Casos sandbox: `base`: chips de filtro (selecionáveis), tags removíveis, com ícones, desabilitado.
Fora do escopo: campo que transforma texto digitado em chips (TagField, P1), arrastar para reordenar, avatares.
