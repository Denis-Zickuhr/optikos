# ImageCanvas  (type: 'imagecanvas')
Propósito:     Mostra uma imagem que preenche a caixa, com zoom e arrastar para ver detalhes: foto de produto, documento escaneado, mapa.
Anatomia:      `.op-imagecanvas` > `__stage` (recorta; focável) > `__img`; `__tools` (diminuir, aumentar, restaurar) e `__status` (texto do erro de carga). É um `<img>` comum movido por transform CSS, não um `<canvas>`.
Config:        `src`, `alt: ''`, `fit: 'contain'` (`'contain' | 'cover'`: como a imagem preenche a caixa no zoom 1), `zoomable: true`, `maxZoom: 8`, `showTools: true`, `ratio` (`aspect-ratio` CSS da caixa, ex.: `'16 / 9'`; senão use `height`).
API:           `setSrc(url)`, `setAlt(text)`, `setFit(fit)`, `zoomTo(level)`, `zoomBy(factor)`, `reset()`, `getZoom()`. O zoom fica entre 1 e `maxZoom`, e a imagem não sai da caixa ao arrastar.
Eventos:       `load`, `error`, `zoom(level)`.
Estados:       `is-loading` (a máscara, até a imagem carregar), `is-error` (uma mensagem no lugar da imagem), `is-zoomed` (o palco mostra o cursor de mão), `is-dragging`.
Teclado/ARIA:  o palco é focável com `role=img` + o texto alternativo. `+` / `-` dão zoom, `0` restaura, as setas movem a imagem com zoom. Roda (com Ctrl ou Meta, para a página ainda rolar), duplo clique (aumenta / restaura), arrastar, pinça com dois dedos. As ferramentas são botões de verdade, com rótulo.
Tokens:        `--op-imagecanvas-bg`, `--op-imagecanvas-radius`, `--op-imagecanvas-tools-bg`, `--op-imagecanvas-tools-fg`.
Casos da sandbox: contain e cover, zoom pelas ferramentas e pela roda, URL quebrada, `zoomable: false`, dentro de um Carousel.
Fora do escopo: desenho ou anotações, rotação, recorte, várias imagens (use um Carousel), faixa de miniaturas.
