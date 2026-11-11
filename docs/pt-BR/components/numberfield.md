# NumberField  (type: 'numberfield')
Propósito:     Campo numérico com limites, passo e casas decimais.
Anatomia:      TextField (`inputmode=decimal`) com valor `number|null`.
Config:        (TextField) + `min`, `max`, `step: 1`, `decimals` (undefined = livre), `allowNegative` (derivado de `min`). Moeda e porcentagem via `Intl`: `format: 'decimal'|'currency'|'percent'`, `currency` (ISO 4217; padrão o do idioma, ou `setCurrency('BRL')`), `locale` (uma tag BCP 47 para este campo; padrão o idioma ativo) — o mesmo código mostra `R$ 1.234,56` e `$1,234.56`. `scale: 100` guarda o valor como inteiro de centavos (`123456` mostra `1.234,56`); `step` segue o número mostrado e `min`/`max` seguem o valor. Porcentagem guarda a fração (`0.15` mostra `15%`).
API:           (Field) + `setMin`, `setMax`, `setStep`, `setDecimals`, `increment()`, `decrement()`.
Eventos:       `change(number|null)`.
Estados:       inválido quando fora de min/max ou texto não numérico.
Teclado/ARIA:  ↑/↓ somam/subtraem `step`, PageUp/PageDown ×10; `role=spinbutton` com `aria-valuemin/max/now`.
Tokens:        os do TextField.
Casos sandbox: inteiro, decimal com 2 casas, min/max, step 5, vazio, texto inválido, pt-BR (vírgula decimal).
Fora do escopo: formatação de moeda (CurrencyField, P1), roda do mouse.
