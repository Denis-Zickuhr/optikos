# ImageField  (type: 'imagefield')
Propósito:     Escolhe uma ou mais imagens para enviar: clicar ou soltar, com pré-visualização, no lugar de um input de arquivo cru. O componente só guarda os arquivos; enviar é com o app.
Anatomia:      `.op-imagefield` (Field) > `.op-imagefield__zone` (um `button`: ícone + dica, o alvo do arrastar) e `.op-imagefield__list` > `__item` (`__img`, `__name`, botão `__remove`). Um `input[type=file]` escondido abre o seletor do navegador.
Config:        (Field) + `accept: 'image/*'` (o `accept` do input; também vale para arquivos soltos), `maxSize` (bytes; sem limite por padrão), `multiple: false`, `maxFiles` (com `multiple`; sem limite por padrão), `placeholder` (a dica na zona).
               O valor é `File | string | null` (string é a URL de uma imagem já salva); com `multiple`, uma lista deles.
API:           (Field) `getValue/setValue/clear`, `add(files)` (as mesmas checagens de soltar), `remove(index)`, `open()` (abre o seletor). As object URLs das pré-visualizações são liberadas quando a imagem sai e no `destroy`.
Eventos:       `change(value)` (Field), `reject(file, reason)` com `reason` `'type' | 'size' | 'count'`: o arquivo é ignorado e o campo mostra a mensagem correspondente como erro.
Estados:       `is-dragover` (arquivo sobre a zona), `is-disabled`, `is-readonly` (só as prévias, sem zona), `is-invalid`. Sem `multiple`, uma imagem nova substitui a antiga.
Teclado/ARIA:  a zona é um `button` de verdade (Enter/Espaço abre o seletor); cada botão de remover se chama `Remover <nome do arquivo>`. As prévias são decorativas (`alt=""`): o nome do arquivo está escrito ao lado; a lista é `role=list`.
Tokens:        `--op-imagefield-zone-bg`, `--op-imagefield-zone-border`, `--op-imagefield-zone-hover-bg`, `--op-imagefield-thumb-size`, `--op-imagefield-radius`.
Casos da sandbox: única, múltipla com limite, limite de tamanho, imagem já salva (URL), disabled/readonly, dentro de um Form (required, `getValues`).
Fora do escopo: envio (progresso, nova tentativa), recorte ou redimensionamento, captura da câmera, reordenar.
