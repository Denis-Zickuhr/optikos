// The docs site look. Only tokens, so picking a theme repaints the whole site (that is the point of the demo).
export const css = `
body{margin:0;background:var(--op-color-bg);color:var(--op-color-fg);font:var(--op-font-size)/var(--op-line-height) var(--op-font-family)}
.site{--site-top:3.5rem;overflow-x:clip;display:grid;grid-template-columns:17rem minmax(0,1fr);grid-template-rows:auto 1fr;min-block-size:100vh}
.site.is-home{grid-template-columns:minmax(0,1fr)}.site.is-home .site__nav{display:none}

/* top bar */
.site__top{grid-column:1/-1;position:sticky;inset-block-start:0;z-index:5;display:flex;align-items:center;gap:.5rem;min-block-size:var(--site-top);box-sizing:border-box;padding:.4rem 1rem;
  background:color-mix(in srgb,var(--op-color-surface) 88%,transparent);backdrop-filter:blur(10px);border-block-end:1px solid var(--op-color-border)}
.site__brand{display:flex;align-items:center;gap:.5rem;font-weight:800;font-size:1.15rem;letter-spacing:-.01em;color:inherit;text-decoration:none;margin-inline-end:.75rem}
.site__logo{inline-size:1.75rem;block-size:1.75rem;flex:none}
.site__links{display:flex;gap:.15rem;margin-inline-end:auto}
.site__links a{padding:.35rem .7rem;border-radius:var(--op-radius-pill);color:var(--op-color-fg-muted);text-decoration:none;font-weight:600}
.site__links a:hover{color:var(--op-color-fg);background:var(--op-color-hover)}.site__links a.is-on{color:var(--op-color-primary);background:var(--op-color-primary-soft)}
.site__theme{inline-size:9rem}.site__lang{inline-size:8.5rem}.site__menu{display:none}.site__top>*{flex:none}

/* side navigation */
.site__nav{position:sticky;inset-block-start:var(--site-top);align-self:start;block-size:calc(100vh - var(--site-top));box-sizing:border-box;overflow:auto;padding:.75rem .5rem;
  border-inline-end:1px solid var(--op-color-border);background:var(--op-color-surface)}
.site__nav .op-textfield{margin-block-end:.5rem}
/* the docs index reads as part of the page, not as an app sidebar: the menu takes the surface colors in every theme */
.site__nav .op-navmenu{--op-navmenu-bg:transparent;--op-navmenu-fg:var(--op-color-fg);--op-navmenu-group-fg:var(--op-color-fg-muted);--op-navmenu-item-hover-bg:var(--op-color-hover);--op-navmenu-active-bg:var(--op-color-primary-soft);--op-navmenu-active-fg:var(--op-color-primary);--op-navmenu-active-bar:var(--op-color-primary);--op-navmenu-item-height:var(--op-control-height)}

/* content */
.site__main{padding:2rem 2.5rem 4rem;max-inline-size:68rem;inline-size:100%;box-sizing:border-box;min-inline-size:0}
.site.is-home .site__main{max-inline-size:none;padding:0}
.site__main h1{margin:0 0 .35rem;font-size:2rem;letter-spacing:-.02em}.site__main h2{margin:2.25rem 0 .75rem;font-size:1.35rem;letter-spacing:-.01em}
.site__lead{color:var(--op-color-fg-muted);margin:0 0 1.25rem;font-size:1.05rem;max-inline-size:46rem}
.site__chips{display:flex;gap:.5rem;flex-wrap:wrap;margin-block:.5rem 1rem}
.site__chip{display:inline-flex;align-items:center;gap:.3rem;padding:.15rem .65rem;border-radius:var(--op-radius-pill);background:var(--op-color-surface-2);border:1px solid var(--op-color-border);font-size:var(--op-font-size-sm);color:var(--op-color-fg-muted)}
.site__chip--accent{color:var(--op-color-primary);background:var(--op-color-primary-soft);border-color:transparent;font-weight:600}
.site code:not([class]){font-family:var(--op-font-mono);font-size:.88em;background:var(--op-color-surface-2);padding:.05em .35em;border-radius:var(--op-radius-sm)}
.site__main table{border-collapse:collapse;inline-size:100%;margin-block:.5rem}.site__main th,.site__main td{text-align:start;padding:.4rem .65rem;border:1px solid var(--op-color-border);vertical-align:top}
.site__main a{color:var(--op-color-primary)}
.site__grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));gap:1rem}
.site__card{display:flex;flex-direction:column;gap:.35rem;padding:1rem 1.1rem;border:1px solid var(--op-color-border);border-radius:var(--op-radius-lg);background:var(--op-color-surface);cursor:pointer;
  text-align:start;font:inherit;color:inherit;text-decoration:none;transition:border-color var(--op-duration) var(--op-easing),transform var(--op-duration) var(--op-easing),box-shadow var(--op-duration) var(--op-easing)}
.site__card:hover{border-color:var(--op-color-primary);transform:translateY(-2px);box-shadow:var(--op-shadow)}
.site__card b{font-size:1.02rem}.site__card span{color:var(--op-color-fg-muted);font-size:var(--op-font-size-sm)}
.site__card .op-icon{color:var(--op-color-primary);--op-icon-size:1.4rem}

/* code blocks are CodeViewers: a little space around them in the guides */
.site .op-codeviewer{margin-block:1rem}

/* home */
.home__hero{position:relative;overflow:hidden;padding:4.5rem 2.5rem 4rem;border-block-end:1px solid var(--op-color-border);
  background:radial-gradient(60rem 30rem at 10% -10%,color-mix(in srgb,var(--op-color-primary) 18%,transparent),transparent 60%),radial-gradient(50rem 30rem at 100% 0%,color-mix(in srgb,var(--op-color-info) 14%,transparent),transparent 60%)}
.home__brand{position:relative;inline-size:fit-content;margin-block-end:1.5rem}
/* the seal turns once and glows on hover; leaving turns it back (a transition, so it never snaps) */
.home__seal{position:relative;z-index:1;display:block;inline-size:7.5rem;block-size:7.5rem;transition:transform 1.2s cubic-bezier(.45,0,.2,1)}
.home__brand:hover .home__seal{transform:rotate(360deg) scale(1.05);animation:home-seal-pulse 1.8s ease-in-out infinite}
@keyframes home-seal-pulse{0%,100%{filter:drop-shadow(0 0 0 rgb(217 191 140 / 0))}50%{filter:drop-shadow(0 0 .9rem rgb(217 191 140 / .6))}}
/* the name hides behind the seal and slides out of it while it spins */
.home__wordmark{position:absolute;inset-block-start:50%;inset-inline-start:calc(100% + 1.25rem);color:#173764;font-size:3.6rem;font-weight:700;letter-spacing:-.025em;line-height:1;white-space:nowrap;
  opacity:0;pointer-events:none;transform:translate(-9rem,-50%) scale(.6);transform-origin:left center;transition:transform 1s cubic-bezier(.3,0,.2,1),opacity .6s ease-in}
.home__brand:hover .home__wordmark{opacity:1;pointer-events:auto;transform:translate(0,-50%);transition:transform 1s cubic-bezier(.2,.7,.2,1) .15s,opacity .5s ease-out .2s}
[data-op-theme~='dark'] .home__wordmark{color:#cfe0f3}
@media (prefers-reduced-motion:reduce){.home__seal,.home__brand:hover .home__seal{transition:none;transform:none;animation:none}.home__wordmark,.home__brand:hover .home__wordmark{transition:opacity .2s;transform:translate(0,-50%)}}
.home__heroInner{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:3rem;align-items:center;max-inline-size:72rem;margin-inline:auto}
.home__hero h1{font-size:clamp(2.2rem,5vw,3.6rem);line-height:1.05;letter-spacing:-.035em;margin:.75rem 0 1rem}
.home__hero p{font-size:1.15rem;color:var(--op-color-fg-muted);margin:0 0 1.75rem;max-inline-size:36rem}
.home__actions{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center}
/* the install command reads as one more button of the row: same height, radius and border; the copy button is its last segment */
.home__install{box-sizing:border-box;display:inline-flex;align-items:stretch;block-size:var(--op-control-height);padding-inline-start:var(--op-control-padding-x);border:var(--op-border-width) solid var(--op-color-border-strong);border-radius:var(--op-radius);background:var(--op-color-surface);overflow:hidden}
.home__install code{align-self:center;padding-inline-end:var(--op-control-padding-x);font:var(--op-font-weight-medium) var(--op-font-size)/1 var(--op-font-mono);background:none}
.home__install .op-button{min-block-size:0;block-size:auto;border:0;border-inline-start:var(--op-border-width) solid var(--op-color-border);border-radius:0}
.home__install b{color:var(--op-color-primary)}
.home__live{position:relative}.home__live>.op-panel{box-shadow:var(--op-shadow-lg)}
.home__liveTag{position:absolute;inset-block-start:-.75rem;inset-inline-end:1rem;z-index:1}
.home__section{max-inline-size:72rem;margin-inline:auto;padding:3.5rem 2.5rem 0}
.home__section h2{font-size:clamp(1.5rem,3vw,2rem);margin:0 0 .35rem;letter-spacing:-.02em}.home__section>p{color:var(--op-color-fg-muted);margin:0 0 1.5rem}
.home__stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:1rem;max-inline-size:72rem;margin:-2rem auto 0;padding-inline:2.5rem;position:relative}
.home__stat{padding:1rem 1.1rem;border:1px solid var(--op-color-border);border-radius:var(--op-radius-lg);background:var(--op-color-surface);box-shadow:var(--op-shadow)}
.home__stat b{display:block;font-size:1.8rem;letter-spacing:-.02em;color:var(--op-color-primary)}.home__stat span{color:var(--op-color-fg-muted);font-size:var(--op-font-size-sm)}
.home__pillar{display:flex;gap:.9rem;padding:1.1rem;border:1px solid var(--op-color-border);border-radius:var(--op-radius-lg);background:var(--op-color-surface)}
.home__pillar .op-icon{flex:none;--op-icon-size:1.3rem;color:var(--op-color-primary);inline-size:2.4rem;block-size:2.4rem;display:grid;place-items:center;border-radius:var(--op-radius);background:var(--op-color-primary-soft)}
.home__pillar b{display:block;margin-block-end:.2rem}.home__pillar span{color:var(--op-color-fg-muted);font-size:var(--op-font-size-sm)}
.home__themes{display:flex;flex-wrap:wrap;gap:.5rem;margin-block-end:1.25rem}
.home__theme{padding:.4rem .9rem;border:1px solid var(--op-color-border);border-radius:var(--op-radius-pill);background:var(--op-color-surface);color:inherit;font:inherit;font-weight:600;cursor:pointer}
.home__theme:hover{border-color:var(--op-color-primary)}.home__theme[aria-pressed=true]{background:var(--op-color-primary);color:var(--op-color-primary-fg);border-color:var(--op-color-primary)}
.home__split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:1.25rem;align-items:start}
.home__footer{max-inline-size:72rem;margin:4rem auto 0;padding:2rem 2.5rem;border-block-start:1px solid var(--op-color-border);color:var(--op-color-fg-muted);display:flex;gap:1.5rem;flex-wrap:wrap}
.home__footer a{color:inherit}

/* component, recipe and demo pages */
.page__layout{display:grid;grid-template-columns:minmax(0,1fr) 13rem;gap:2rem}
.page__toc{position:sticky;inset-block-start:calc(var(--site-top) + 1.5rem);align-self:start;font-size:var(--op-font-size-sm)}
.page__toc b{display:block;margin-block-end:.4rem;color:var(--op-color-fg-muted);text-transform:uppercase;letter-spacing:.06em;font-size:.72rem}
.page__toc a{display:block;padding:.2rem 0 .2rem .75rem;border-inline-start:2px solid var(--op-color-border);color:var(--op-color-fg-muted);text-decoration:none}
.page__toc a:hover{color:var(--op-color-primary);border-color:var(--op-color-primary)}
.example{border:1px solid var(--op-color-border);border-radius:var(--op-radius-lg);background:var(--op-color-surface);margin-block-end:1.25rem;overflow:hidden}
.example>header{padding:.75rem 1.1rem}.example h3{margin:0;font-size:1.02rem}.example>header p{margin:.2rem 0 0;color:var(--op-color-fg-muted)}
.example .op-tabs__panels{border-block-start:1px solid var(--op-color-border)}
.example__stage{padding:1.25rem;display:flex;flex-wrap:wrap;gap:.75rem;align-items:flex-start;min-block-size:5rem;overflow:auto;
  background-image:radial-gradient(var(--op-color-border) 1px,transparent 1px);background-size:16px 16px}
.example__code{display:grid;gap:.6rem;padding:1rem}
.example__code textarea{box-sizing:border-box;inline-size:100%;min-block-size:10rem;max-block-size:24rem;padding:.75rem;border:1px solid var(--op-color-border);border-radius:var(--op-radius);background:var(--op-color-surface-2);color:var(--op-color-fg);font:.8rem/1.5 var(--op-font-mono);resize:vertical}
.example__bar{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}.example__err{color:var(--op-color-danger);font-size:var(--op-font-size-sm)}
.sheet{display:grid;grid-template-columns:10rem minmax(0,1fr);gap:.6rem 1.25rem;padding:1.1rem}
.sheet dt{font-weight:600;color:var(--op-color-fg-muted)}.sheet dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
.recipe__stage{padding:1.5rem;border:1px solid var(--op-color-border);border-radius:var(--op-radius-lg);margin-block-end:1.25rem;background-color:var(--op-color-bg);
  background-image:radial-gradient(var(--op-color-border) 1px,transparent 1px);background-size:16px 16px;overflow:auto}
.recipe__notes{margin:.25rem 0 1.5rem;padding:0;list-style:none;display:grid;gap:.5rem}
.recipe__notes li{display:flex;gap:.6rem;align-items:flex-start}.recipe__notes .op-icon{color:var(--op-color-success);flex:none;margin-block-start:.15rem}
.demo{display:flex;flex-direction:column;border:1px solid var(--op-color-border);border-radius:var(--op-radius-lg);background:var(--op-color-surface);overflow:hidden}
.demo__shot{position:relative;aspect-ratio:16/10;overflow:hidden;background:var(--op-color-surface-2);border-block-end:1px solid var(--op-color-border)}
.demo__shot iframe{position:absolute;inset:0;inline-size:400%;block-size:400%;transform:scale(.25);transform-origin:0 0;border:0;pointer-events:none}
.demo__body{display:flex;flex-direction:column;gap:.4rem;padding:1rem 1.1rem;flex:1}.demo__body p{margin:0;color:var(--op-color-fg-muted);font-size:var(--op-font-size-sm);flex:1}
.demo__actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-block-start:.5rem}

@media (max-width:60rem){
  .site{grid-template-columns:minmax(0,1fr)}.site__menu{display:inline-flex}.site__links{display:none}
  .site__nav{position:fixed;inset-block:var(--site-top) 0;inset-inline-start:0;z-index:4;inline-size:17rem;block-size:auto;transform:translateX(-100%);transition:transform var(--op-duration) var(--op-easing)}
  .site.is-home .site__nav{display:block}.site.is-nav-open .site__nav{transform:none;box-shadow:var(--op-shadow-lg)}
  .site__main{padding:1.25rem 1rem 3rem}.page__layout{grid-template-columns:minmax(0,1fr)}.page__toc{display:none}
  .home__hero{padding:2.5rem 1rem 3rem}.home__heroInner,.home__split{grid-template-columns:minmax(0,1fr)}.home__section,.home__stats,.home__footer{padding-inline:1rem}
  .sheet{grid-template-columns:minmax(0,1fr)}.site__theme,.site__lang{inline-size:5.5rem}.site__brand{font-size:0;gap:0}
  .site__search .op-button__text{display:none}.site__brand{margin-inline-end:auto}.site__top{gap:.25rem;padding-inline:.5rem}
  .home__seal{inline-size:5.5rem;block-size:5.5rem}.home__wordmark{font-size:2.6rem}.home__hero h1{font-size:2.1rem}.home__install{display:none}
}
@media (prefers-reduced-motion:reduce){.site__card,.site__card:hover{transition:none;transform:none}}
`;
