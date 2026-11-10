# InputGroup  (type: 'inputgroup')
Propósito:     Junta texto ou botões à caixa do input de um campo: uma moeda (`R$`), uma unidade (`kg`), um domínio (`https://` … `.com`), um botão "Copiar" ou "Buscar". O campo mantém seu rótulo, ajuda, erro, nome e valor.
Anatomia:      `.op-inputgroup` (sem caixa própria) > o campo, cujo controle vira `.op-inputgroup__row` > `.op-inputgroup__affix` (texto, um `span`) ou `.op-inputgroup__btn` (um `button`) + a caixa do input do campo + o mesmo do outro lado. Os cantos internos ficam retos para a linha parecer um controle só.
Config:        (Container) + `prefix`, `suffix`: um texto, ou um botão `{ icon, text, ariaLabel, handler(field) }`. `items`: um campo (qualquer um: TextField, NumberField, Select, DateField...).
API:           `setPrefix(affix)`, `setSuffix(affix)`, `getField()`.
Eventos:       — (os eventos do próprio campo; um botão chama o seu `handler`).
Estados:       `has-prefix`, `has-suffix` (no campo).
Teclado/ARIA:  Textos descrevem o input (entram no `aria-describedby` dele, então "R$" é lido com o preço). Botões são botões de verdade na ordem do Tab, nomeados pelo `ariaLabel` ou pelo texto.
Tokens:        `--op-inputgroup-affix-bg`, `--op-inputgroup-affix-fg`.
Casos sandbox: um preço com `R$`, um site com `https://` e `.com`, um token só leitura com botão Copiar, uma busca com botão "Ir", um Select com uma unidade.
Fora do escopo: vários prefixos, botões com menu (abra um Menu no handler), máscaras.
