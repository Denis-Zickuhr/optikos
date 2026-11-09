// Mini e-commerce demo ("Loop & Co"): catalog with live filters, product window, cart widget, coupon and a fake checkout wizard. Public API only.
import { create, register, Component, ui, Direction, Store, StepForm, Window, Widget, MessageBox, toast, validators, type Container, type DataView, type Button, type Label, type ComponentConfig, type Model } from 'optikos';
import { products, categories, picture, money, type Product } from './data';

const css = document.createElement('style');
css.textContent = `html,body{margin:0;height:100%}
.sh-top{flex-wrap:nowrap!important}.sh-brand{font-weight:800;font-size:1.15rem;letter-spacing:-.02em;padding-inline:var(--op-space-2);white-space:nowrap}
.sh-burger{display:none}.op-layout-border.is-narrow .sh-burger{display:inline-flex}
.sh-filters{padding:var(--op-space-4);overflow:auto;background:var(--op-color-surface);--op-region-drawer-width:18rem}.sh-filters h3{margin:0 0 var(--op-space-3);font-size:var(--op-font-size)}
.sh-main{display:flex;flex-direction:column;min-block-size:0;block-size:100%}.sh-bar{padding:var(--op-space-3) var(--op-space-4);color:var(--op-color-fg-muted);display:flex;gap:var(--op-space-3);align-items:center;flex-wrap:wrap}
.sh-grid{flex:1;min-block-size:0;overflow:auto;padding:0 var(--op-space-4) var(--op-space-4)}
.sh-card{display:flex;flex-direction:column;gap:.35rem;text-align:start}.sh-card img{inline-size:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--op-radius)}
.sh-card.is-out img{filter:grayscale(1) opacity(.6)}.sh-name{font-weight:600}.sh-meta{display:flex;justify-content:space-between;align-items:center;gap:.5rem}.sh-price{font-weight:700}.sh-stars{color:var(--op-color-warning);font-size:var(--op-font-size-sm)}
.sh-card button{align-self:stretch}
.sh-cartlist{overflow-x:hidden}.sh-line{inline-size:100%;box-sizing:border-box;min-inline-size:0;display:grid;grid-template-columns:3.2rem 1fr auto;gap:.6rem;align-items:center}.sh-line>*{min-inline-size:0}.sh-line>:last-child{text-align:end}.sh-line img{inline-size:3.2rem;aspect-ratio:1;object-fit:cover;border-radius:var(--op-radius-sm)}
.sh-qty{display:flex;align-items:center;gap:.25rem;font-variant-numeric:tabular-nums}.sh-qty button,.sh-del{border:1px solid var(--op-color-border);background:var(--op-color-surface);color:inherit;border-radius:var(--op-radius-sm);cursor:pointer;inline-size:1.6rem;block-size:1.6rem;font:inherit}
.sh-del{border:0;background:none;color:var(--op-color-fg-muted)}
.sh-totals{display:grid;grid-template-columns:1fr auto;gap:.25rem 1rem;padding:var(--op-space-3) 0;border-block-start:1px solid var(--op-color-border);font-variant-numeric:tabular-nums}.sh-totals b{font-size:1.1rem}
.sh-review{display:grid;gap:.4rem}.sh-review hr{inline-size:100%;border:0;border-block-start:1px solid var(--op-color-border)}
.sh-detail{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--op-space-4)}.sh-detail img{inline-size:100%;border-radius:var(--op-radius)}@media (max-width:40rem){.sh-detail{grid-template-columns:1fr}}`;
document.head.append(css);

/** Holds a ready-made DOM node (or HTML text) as a component, so it can sit in any layout. */
class Html extends Component<ComponentConfig & { node?: Node; html?: string }> {
  protected override onRender() {
    if (this.config.node) this.el.append(this.config.node);
    else this.el.innerHTML = this.config.html ?? '';
  }
}
register('sh-html', Html);

const node = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') => Object.assign(document.createElement(tag), { className: cls, textContent: text });
/** Marks a button inside a card as an item action (the DataView reports it as `item-action`, without selecting the card). */
const act = (b: HTMLButtonElement, action: string, label: string) => {
  b.dataset.opAction = action;
  b.setAttribute('aria-label', label);
  return b;
};
const stars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
const FREE_SHIPPING_FROM = 100;
const coupons: Record<string, { label: string; off?: number; freeShip?: boolean }> = { WELCOME10: { label: '10% off', off: 0.1 }, FREESHIP: { label: 'Free shipping', freeShip: true } };

// ---- cart state ------------------------------------------------------------------------------------------------------------------------------------
interface Line { id: number; qty: number; size?: string }
const cart: Line[] = [];
let coupon: string | undefined;
let express = false;
const byId = (id: number) => products.find((p) => p.id === id)!;
const subtotal = () => cart.reduce((s, l) => s + byId(l.id).price * l.qty, 0);
const totals = () => {
  const sub = subtotal();
  const discount = coupon && coupons[coupon].off ? sub * coupons[coupon].off! : 0;
  const free = !cart.length || sub - discount >= FREE_SHIPPING_FROM || !!coupons[coupon ?? '']?.freeShip;
  const shipping = (free ? 0 : 7.9) + (express && cart.length ? 12 : 0);
  return { sub, discount, shipping, total: sub - discount + shipping };
};

function addToCart(p: Product, qty = 1, size?: string) {
  if (p.stock <= 0) return toast({ type: 'warning', text: `${p.name} is sold out` });
  const line = cart.find((l) => l.id === p.id && l.size === size);
  const have = cart.filter((l) => l.id === p.id).reduce((s, l) => s + l.qty, 0);
  if (have + qty > p.stock) return toast({ type: 'warning', text: `Only ${p.stock} in stock` });
  if (line) line.qty += qty;
  else cart.push({ id: p.id, qty, size });
  cartChanged();
  toast({ type: 'success', text: `${p.name} added`, duration: 1800 });
}

// ---- catalog ---------------------------------------------------------------------------------------------------------------------------------------------
const store = new Store<Product>({ data: products });
const q = ui.text('q', 'Search', { placeholder: 'Name or description', clearable: true, debounce: 300 });
const cat = ui.radio('cat', 'Category', ['All', ...categories], { value: 'All' });
const price = ui.slider('price', 'Price', { range: true, min: 0, max: 250, step: 5, value: [0, 250], showValue: 'always', format: (v: number) => `$${v}`, debounce: 150 });
const stock = ui.check('stock', 'In stock only');
const sort = ui.select('sort', 'Sort by', [{ value: 'featured', label: 'Featured' }, { value: 'asc', label: 'Price: low to high' }, { value: 'desc', label: 'Price: high to low' }, { value: 'rating', label: 'Best rated' }], { value: 'featured' });

let view!: DataView;
let count!: Label;
function applyFilters() {
  const text = String(q.getValue() ?? '').toLowerCase();
  const [lo, hi] = price.getValue() as [number, number];
  const c = cat.getValue();
  void store.filter((m) => { const p = m.data; return (c === 'All' || p.category === c) && p.price >= lo && p.price <= hi && (!stock.getValue() || p.stock > 0) && (p.name + p.desc).toLowerCase().includes(text); }).then(() => {
    count.setText(`${store.getFiltered().length} of ${products.length} products`);
  });
  const s = sort.getValue();
  if (s === 'asc' || s === 'desc') store.sort('price', s);
  else if (s === 'rating') store.sort('rating', 'desc');
  else store.sort('id', 'asc');
}
for (const f of [q, cat, price, stock, sort]) f.on('settled', applyFilters); // `settled`: after typing or dragging pauses (search 300 ms, price 150 ms)

const productCard = (m: Model<Product>) => {
  const p = m.data;
  const out = p.stock <= 0;
  const card = node('span', `sh-card${out ? ' is-out' : ''}`);
  const img = Object.assign(node('img'), { src: picture(p), alt: p.name, loading: 'lazy' });
  const add = Object.assign(node('button', 'op-button op-button--primary', out ? 'Sold out' : 'Add to cart'), { type: 'button', disabled: out });
  add.dataset.opAction = 'add';
  const meta = node('span', 'sh-meta');
  meta.append(node('span', 'sh-price', money(p.price)), node('span', 'sh-stars', `★ ${p.rating}`));
  card.append(img, node('span', 'sh-name', p.name), meta, add);
  return card;
};

function openProduct(p: Product) {
  let size = p.sizes?.[1];
  const qty = ui.number('qty', 'Quantity', { min: 1, max: Math.max(1, p.stock), value: 1, decimals: 0 });
  const body = node('div', 'sh-detail');
  const info = node('div');
  info.append(node('h2', '', p.name), node('div', 'sh-stars', `${stars(p.rating)} ${p.rating}`), node('p', '', p.desc), node('p', 'sh-price', money(p.price)), node('p', '', p.stock > 0 ? `${p.stock} in stock` : 'Sold out'));
  const fields = ui.col(...(p.sizes ? [ui.select('size', 'Size', p.sizes, { value: size, listeners: { change: (v: string) => (size = v) } })] : []), qty);
  body.append(Object.assign(node('img'), { src: picture(p), alt: p.name }), info);
  const win: Window = create<Window>({
    type: 'window', title: p.name, width: 640, closeOnBackdrop: true, closeAction: 'destroy', layout: 'vbox',
    items: [{ type: 'sh-html', node: body }, fields],
    buttons: [ui.button('Close', () => win.close()), ui.primary('Add to cart', () => { addToCart(p, Number(qty.getValue() ?? 1), size); win.close(); }, { disabled: p.stock <= 0 })],
  } as never);
  win.show();
}

// ---- cart widget -------------------------------------------------------------------------------------------------------------------------------------------
const cartStore = new Store<Line & { name: string }>({ data: [] });
let cartBtn!: Button;
const summary = node('div', 'sh-totals');
let checkoutBtn!: Button;
const cartView = create<DataView>({
  type: 'dataview', cls: 'sh-cartlist', store: cartStore, selection: 'none', itemWidth: '15rem', gap: '.75rem', emptyText: 'Your cart is empty', ariaLabel: 'Cart lines',
  renderer: (m: Model<Line>) => {
    const l = m.data, p = byId(l.id);
    const row = node('span', 'sh-line');
    const qtyBox = node('span', 'sh-qty');
    const btn = (label: string, action: string, aria = label) => act(Object.assign(node('button', '', label), { type: 'button' }), action, aria);
    qtyBox.append(btn('−', 'dec', 'Fewer'), node('span', '', String(l.qty)), btn('+', 'inc', 'More'));
    const mid = node('span');
    mid.append(node('div', 'sh-name', p.name), node('small', '', `${money(p.price)}${l.size ? ` · ${l.size}` : ''}`), qtyBox);
    const right = node('span');
    right.append(node('div', 'sh-price', money(p.price * l.qty)), act(Object.assign(node('button', 'sh-del', '✕'), { type: 'button' }), 'remove', 'Remove'));
    row.append(Object.assign(node('img'), { src: picture(p), alt: '' }), mid, right);
    return row;
  },
} as never);
cartView.on('item-action', (action: string, m: Model<Line>) => {
  const l = cart.find((x) => x.id === m.data.id && x.size === m.data.size)!;
  if (action === 'inc' && l.qty < byId(l.id).stock) l.qty++;
  else if (action === 'dec') l.qty--;
  else if (action === 'remove') l.qty = 0;
  if (l.qty <= 0) cart.splice(cart.indexOf(l), 1);
  cartChanged();
});

function cartChanged() {
  cartStore.loadData(cart.map((l) => ({ ...l, name: byId(l.id).name })));
  cartBtn.setText(`Cart (${cart.reduce((s, l) => s + l.qty, 0)})`);
  const t = totals();
  const left = Math.max(0, FREE_SHIPPING_FROM - (t.sub - t.discount));
  const rows: [string, string][] = [['Subtotal', money(t.sub)]];
  if (t.discount) rows.push([`Coupon ${coupon}`, `−${money(t.discount)}`]);
  rows.push(['Shipping', t.shipping ? money(t.shipping) : 'Free'], ['Total', money(t.total)]);
  summary.replaceChildren(...rows.flatMap(([a, b], i) => [node(i === rows.length - 1 ? 'b' : 'span', '', a), node(i === rows.length - 1 ? 'b' : 'span', '', b)]));
  if (cart.length && left > 0 && !coupons[coupon ?? '']?.freeShip) summary.append(node('small', '', `Add ${money(left)} more for free shipping`));
  checkoutBtn.setDisabled(!cart.length);
}

checkoutBtn = ui.primary('Checkout', () => { cartWidget.close(); checkout(); }, { icon: 'chevron-right', iconPos: 'right', width: '100%' }) as Button;
const cartWidget = create<Widget>({
  type: 'widget', title: 'Your cart', icon: 'star', side: 'right', size: 380, sideSwitcher: true, layout: 'vbox',
  items: [{ type: 'container', flex: 1, layout: 'fit', items: [cartView] }, { type: 'sh-html', node: summary }, ui.button('Coupon…', async () => {
    const code = (await MessageBox.prompt('Enter a coupon code (try WELCOME10 or FREESHIP)', { title: 'Coupon', placeholder: 'CODE' }))?.trim().toUpperCase();
    if (!code) return;
    if (coupons[code]) { coupon = code; cartChanged(); toast({ type: 'success', text: `${coupons[code].label} applied` }); }
    else toast({ type: 'error', text: `"${code}" is not a valid coupon` });
  }, { variant: 'ghost' }), checkoutBtn],
} as never);

// ---- checkout ----------------------------------------------------------------------------------------------------------------------------------------------------------
const luhn = (n: string) => { let s = 0; [...n].reverse().forEach((d, i) => { let x = Number(d); if (i % 2) { x *= 2; if (x > 9) x -= 9; } s += x; }); return s % 10 === 0; };
function checkout() {
  const wizard = create<StepForm>({
    type: 'stepform', review: (v: Record<string, any>) => {
      express = v.method === 'express';
      const t = totals();
      const box = node('div', 'sh-review');
      box.append(node('b', '', 'Ship to'), node('span', '', `${v.name}, ${v.street}, ${v.zip} ${v.city}, ${v.country}`), node('span', '', `Contact: ${v.email}`), node('hr'), node('b', '', `${cart.length} item(s)`));
      for (const l of cart) box.append(node('span', '', `${l.qty} × ${byId(l.id).name}${l.size ? ` (${l.size})` : ''} — ${money(byId(l.id).price * l.qty)}`));
      box.append(node('hr'), node('span', '', `Card •••• ${String(v.card ?? '').replace(/\D/g, '').slice(-4)}`), node('b', '', `Pay ${money(t.total)} (${express ? 'express' : 'standard'} shipping)`));
      return box;
    },
    finishText: 'Place order', cancelText: 'Back to cart',
    steps: [
      { title: 'Contact', items: [ui.email('email', 'Email', { required: true, validators: [validators.email()], colspan: 2 })] },
      { title: 'Shipping', items: [
        ui.text('name', 'Full name', { required: true, colspan: 2 }), ui.text('street', 'Street and number', { required: true, colspan: 2 }),
        ui.text('city', 'City', { required: true }), ui.text('zip', 'Postal code', { required: true, pattern: /^[\w -]{3,10}$/ }),
        ui.select('country', 'Country', ['United States', 'Canada', 'United Kingdom', 'Germany'], { required: true, value: 'United States' }),
        ui.radio('method', 'Delivery', [{ value: 'standard', label: 'Standard (3–5 days)' }, { value: 'express', label: 'Express (+$12)' }], { value: 'standard', direction: Direction.Horizontal }),
      ] },
      { title: 'Payment', items: [
        ui.text('card', 'Card number', { required: true, placeholder: '4242 4242 4242 4242', colspan: 2, help: 'Any Luhn-valid number works (4242 4242 4242 4242).', validators: [(v: string) => (/^\d{13,19}$/.test(v.replace(/\s/g, '')) && luhn(v.replace(/\s/g, '')) ? '' : 'Enter a valid card number')] }),
        ui.text('exp', 'Expiry (MM/YY)', { required: true, pattern: /^(0[1-9]|1[0-2])\/\d{2}$/, placeholder: '08/29' }), ui.secret('cvc', 'CVC', { required: true, pattern: /^\d{3,4}$/ }),
      ] },
    ],
  } as never);
  const win: Window = create<Window>({ type: 'window', title: 'Checkout', width: 720, layout: 'fit', items: [wizard], closeAction: 'destroy' });
  wizard.on('cancel', () => (win.close(), cartWidget.open()));
  wizard.on('finish', () => {
    win.setLoading?.('Processing payment…');
    setTimeout(() => {
      const number = `LC-${Math.floor(100000 + Math.random() * 900000)}`;
      const paid = totals().total;
      cart.length = 0;
      coupon = undefined;
      express = false;
      cartChanged();
      win.close();
      void MessageBox.alert(`Thank you! Order ${number} for ${money(paid)} is confirmed. A receipt is on its way.`, { title: 'Order placed' });
    }, 1200);
  });
  win.show();
}

// ---- page ------------------------------------------------------------------------------------------------------------------------------------------------------------------------
view = create<DataView>({
  type: 'dataview', store, itemWidth: '13rem', gap: '1rem', selection: 'none', emptyText: 'No product matches these filters', ariaLabel: 'Products', renderer: productCard,
  listeners: {
    'item-action': (_a: string, m: Model<Product>) => addToCart(m.data),
    'item-click': (m: Model<Product>) => openProduct(m.data),
    'item-activate': (m: Model<Product>) => openProduct(m.data),
  },
} as never);
count = create<Label>({ type: 'label', variant: 'muted', text: '' });

const shell = create<Container>({
  type: 'viewport', renderTo: document.body, layout: { type: 'border', narrowBelow: 860 },
  items: [
    { type: 'toolbar', region: 'north', cls: 'sh-top', items: [
      { type: 'button', icon: 'menu', variant: 'ghost', cls: 'sh-burger', ariaLabel: 'Filters', handler: () => shell.layout?.toggleRegion?.('west') },
      { type: 'sh-html', cls: 'sh-brand', html: 'Loop &amp; Co' }, '->',
      (cartBtn = ui.button('Cart (0)', () => cartWidget.setOpen(), { icon: 'star', variant: 'primary' }) as Button),
    ] },
    { type: 'container', region: 'west', width: 280, cls: 'sh-filters', layout: 'vbox', gap: 16, items: [{ type: 'sh-html', html: '<h3>Filters</h3>' }, q, cat, price, stock, sort, ui.button('Clear filters', () => { q.setValue(''); cat.setValue('All'); price.setValue([0, 250]); stock.setValue(false); sort.setValue('featured'); }, { variant: 'ghost' })] },
    { type: 'container', region: 'center', cls: 'sh-main', layout: 'vbox', items: [{ type: 'container', cls: 'sh-bar', items: [count] }, { type: 'container', cls: 'sh-grid', flex: 1, items: [view] }] },
  ],
} as never);
cartChanged();
applyFilters();
