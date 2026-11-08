# NumberField  (type: 'numberfield')
Propósito:     Campo numérico com limites, passo e casas decimais.
Anatomia:      TextField (`inputmode=decimal`) com valor `number|null`.
Config:        (TextField) + `min`, `max`, `step: 1`, `decimals` (undefined = livre), `allowNegative` (derivado de `min`).
API:           (Field) + `setMin`, `setMax`, `setStep`, `setDecimals`, `increment()`, `decrement()`.
Eventos:       `change(number|null)`.
Estados:       inválido quando fora de min/max ou texto não numérico.
Teclado/ARIA:  ↑/↓ somam/subtraem `step`, PageUp/PageDown ×10; `role=spinbutton` com `aria-valuemin/max/now`.
Tokens:        os do TextField.
Casos sandbox: inteiro, decimal com 2 casas, min/max, step 5, vazio, texto inválido, pt-BR (vírgula decimal).
Fora do escopo: formatação de moeda (CurrencyField, P1), roda do mouse.
