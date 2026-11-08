// Fake catalog for the shop demo: generated SVG "photos", no images and no network.
export interface Product { id: number; name: string; category: string; price: number; rating: number; stock: number; sizes?: string[]; desc: string; hue: number; shape: number }

export const categories = ['Home', 'Tech', 'Apparel', 'Outdoor'];

const rows: [string, string, number, number, number, string[] | undefined, string][] = [
  ['Ceramic pour-over set', 'Home', 42, 4.8, 12, undefined, 'Hand-glazed dripper and carafe for a slow, clean cup.'],
  ['Linen throw blanket', 'Home', 68, 4.6, 5, undefined, 'Stonewashed linen that gets softer with every wash.'],
  ['Walnut desk shelf', 'Home', 89, 4.7, 0, undefined, 'Oiled walnut riser with a cable channel. Sold out until spring.'],
  ['Wireless earbuds', 'Tech', 129, 4.4, 30, undefined, '30-hour battery, noise reduction and a pocket-sized case.'],
  ['Mechanical keyboard', 'Tech', 149, 4.9, 8, undefined, 'Hot-swappable switches, aluminium frame, quiet stabilisers.'],
  ['Pocket projector', 'Tech', 219, 4.2, 3, undefined, 'A 100-inch picture from a device the size of a paperback.'],
  ['Merino crew sweater', 'Apparel', 96, 4.7, 20, ['S', 'M', 'L', 'XL'], 'Fine-gauge merino, temperature regulating, machine washable.'],
  ['Canvas work jacket', 'Apparel', 138, 4.5, 14, ['S', 'M', 'L', 'XL'], 'Waxed canvas with corduroy collar. Ages like leather.'],
  ['Everyday sneakers', 'Apparel', 84, 4.3, 25, ['38', '40', '42', '44'], 'Recycled knit upper and a cushioned natural-rubber sole.'],
  ['Trail daypack 22L', 'Outdoor', 74, 4.6, 18, undefined, 'Light, weatherproof and with a sternum strap that stays put.'],
  ['Insulated bottle 1L', 'Outdoor', 29, 4.8, 60, undefined, 'Cold for 24 hours, hot for 12. Fits every cup holder.'],
  ['Two-person tent', 'Outdoor', 245, 4.5, 6, undefined, 'Three-season, 1.9 kg, pitches in under four minutes.'],
];
export const products: Product[] = rows.map(([name, category, price, rating, stock, sizes, desc], i) => ({ id: i + 1, name, category, price, rating, stock, sizes, desc, hue: (i * 47 + 12) % 360, shape: i % 4 }));

/** A product picture: soft gradient, a big shape per shape number, and the initials. */
export function picture(p: Product): string {
  const shapes = [
    `<circle cx="200" cy="150" r="78" fill="hsl(${p.hue},45%,96%)" opacity=".85"/>`,
    `<rect x="120" y="70" width="160" height="160" rx="26" fill="hsl(${p.hue},45%,96%)" opacity=".85"/>`,
    `<polygon points="200,60 290,225 110,225" fill="hsl(${p.hue},45%,96%)" opacity=".85"/>`,
    `<rect x="95" y="105" width="210" height="90" rx="45" fill="hsl(${p.hue},45%,96%)" opacity=".85"/>`,
  ];
  const initials = p.name.split(' ').slice(0, 2).map((w) => w[0]).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${p.hue},55%,62%)"/><stop offset="1" stop-color="hsl(${(p.hue + 50) % 360},60%,45%)"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/>${shapes[p.shape]}<text x="200" y="165" text-anchor="middle" font-family="sans-serif" font-size="44" font-weight="700" fill="hsl(${p.hue},50%,30%)">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
