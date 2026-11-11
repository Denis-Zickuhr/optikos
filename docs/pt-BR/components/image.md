# Image  (type: 'image')
Propósito:     Uma imagem numa caixa que mantém a proporção enquanto carrega e mostra um substituto quando o arquivo não existe (logos, fotos em cards e tabelas).
Anatomia:      `op-image` (`--cover|--contain`, `--rounded`, `has-image`) > `op-image__fallback` (um ícone) + `op-image__img` (lazy, decodificação assíncrona).
Config:        `src`, `alt` (vazio = decorativa), `ratio` (`'16/9'`, `'1'`: a caixa a mantém, então a página não pula), `fit: 'cover'|'contain'` (cover), `fallback` (nome de ícone, ou uma segunda URL tentada uma vez; padrão o ícone `image`), `eager` (o padrão é lazy), `rounded`.
API:           `setSrc`, `setAlt`, `setRatio`.
Eventos:       `error` quando o arquivo (e a URL substituta) falharam.
Estados:       Carregando / carregada (`has-image`) / falhou (aparece o substituto).
Teclado/ARIA:  Um `<img>` de verdade com `alt`.
Tokens:        `--op-image-bg`, `--op-image-radius`, `--op-image-icon-size`.
Casos sandbox: `base`: proporções, fit, um arquivo ausente com ícone e com segunda URL.
Fora do escopo: Zoom e arrasto (`imagecanvas`), `srcset` responsivo, recorte.
