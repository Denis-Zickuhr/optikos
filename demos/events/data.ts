// Fake content for the events landing page: fictional fashion week, models and partner brands. Pictures are generated SVGs.
export interface Model { id: number; name: string; city: string; height: string; agency: string; bio: string; looks: string[]; hue: number }
export interface Partner { id: number; brand: string; product: string; tagline: string; story: string; hue: number; shape: number }
export interface Show { time: string; title: string; designer: string; venue: string; day: number }

export const EVENT_START = new Date('2027-03-05T19:00:00');

export const models: Model[] = [
  { id: 1, name: 'Amara Okafor', city: 'Lagos', height: '1.80 m', agency: 'Northlight', bio: 'Opened three houses last season. Trained as a dancer, walks like she is arriving somewhere important.', looks: ['Opening look, Aurelle', 'Finale gown, Maison Vell'], hue: 22 },
  { id: 2, name: 'Léa Marchand', city: 'Lyon', height: '1.76 m', agency: 'Kestrel', bio: 'Editorial regular and the face of the spring fragrance campaign. Speaks four languages, none of them while walking.', looks: ['Tailored ivory suit', 'Sheer organza coat'], hue: 340 },
  { id: 3, name: 'Hiro Tanaka', city: 'Osaka', height: '1.86 m', agency: 'Kestrel', bio: 'Menswear specialist with a taste for oversized tailoring and quiet colour.', looks: ['Double-breasted camel coat', 'Technical silk shirt'], hue: 205 },
  { id: 4, name: 'Sofia Reyes', city: 'Monterrey', height: '1.78 m', agency: 'Solstice', bio: 'Breakout of the year. Her runway debut was a standing ovation and a ripped hem.', looks: ['Embroidered cape', 'Copper slip dress'], hue: 38 },
  { id: 5, name: 'Noor Haddad', city: 'Amman', height: '1.74 m', agency: 'Northlight', bio: 'Sculptor by day, model by night. Brings the stillness of a statue to a moving line.', looks: ['Pleated column dress', 'Gilded headpiece'], hue: 160 },
  { id: 6, name: 'Elias Varga', city: 'Budapest', height: '1.88 m', agency: 'Solstice', bio: 'Former architect. Prefers a long, slow turn at the end of the runway.', looks: ['Black wool tuxedo', 'Mesh knit tank'], hue: 265 },
  { id: 7, name: 'Maya Lindqvist', city: 'Gothenburg', height: '1.79 m', agency: 'Kestrel', bio: 'Pale hair, loud laugh, unflappable on any surface including wet marble.', looks: ['Silver sequin set', 'Feathered trench'], hue: 190 },
  { id: 8, name: 'Dario Silva', city: 'Lisbon', height: '1.84 m', agency: 'Northlight', bio: 'Surfer turned runway regular. Brings salt air and a very good jacket.', looks: ['Linen safari set', 'Velvet smoking jacket'], hue: 12 },
];

export const partners: Partner[] = [
  { id: 1, brand: 'Aurelle', product: 'Noir de Nuit eau de parfum', tagline: 'The scent worn by the opening looks.', story: 'Backstage, the opening looks are finished with two sprays of Noir de Nuit: bergamot, black tea and a trace of smoke. Our editors asked the perfumer how a scent is built to be remembered from the third row.', hue: 275, shape: 0 },
  { id: 2, brand: 'Maison Vell', product: 'Sculpted leather clutch', tagline: 'Carried by every model in the finale.', story: 'Cut from a single piece of vegetable-tanned leather, the clutch took a leatherworker nine hours. It is the one accessory that appears in all twelve finale looks.', hue: 25, shape: 1 },
  { id: 3, brand: 'Kestrel Optics', product: 'Round acetate sunglasses', tagline: 'The front-row uniform, in four finishes.', story: 'Front-row guests are photographed more than most runway looks. These frames are light enough to wear through a three-hour day of shows without a mark on the nose.', hue: 200, shape: 2 },
  { id: 4, brand: 'Solstice Skin', product: 'Radiance concealer stick', tagline: 'Used by the backstage team all week.', story: 'Our makeup lead rotated through two hundred faces in a morning. The stick that stayed in her apron was this one: it blends with fingertips and survives a hot light rig.', hue: 345, shape: 3 },
];

export const schedule: Show[] = [
  { day: 0, time: '19:00', title: 'Opening gala: "First Light"', designer: 'Aurelle', venue: 'Grand Hall' },
  { day: 0, time: '21:00', title: 'Menswear: "Quiet Tailoring"', designer: 'Hiro Atelier', venue: 'Glass Gallery' },
  { day: 0, time: '22:30', title: 'After-party and portfolio mixer', designer: 'Open to credentials', venue: 'Rooftop' },
  { day: 1, time: '10:00', title: 'Casting call: new faces', designer: 'Northlight, Kestrel, Solstice', venue: 'Studio B' },
  { day: 1, time: '13:00', title: 'Panel: Sustainability on the runway', designer: 'Four houses, one moderator', venue: 'Library' },
  { day: 1, time: '19:30', title: 'Collection: "Copper & Smoke"', designer: 'Maison Vell', venue: 'Grand Hall' },
  { day: 2, time: '11:00', title: 'Student showcase', designer: 'Municipal Design School', venue: 'Glass Gallery' },
  { day: 2, time: '16:00', title: 'Accessories salon', designer: 'Kestrel Optics, Solstice', venue: 'Library' },
  { day: 2, time: '20:00', title: 'Finale: twelve looks, one night', designer: 'All houses', venue: 'Grand Hall' },
];

export const faqs: [string, string][] = [
  ['Is this open to the public?', 'The evening shows are by invitation. Daytime sessions (casting call, panels, student showcase) are open with a free pass; request one below.'],
  ['Can I buy the clothes I see?', 'No, this is not a shop. The featured partner products are editorial recommendations: each page tells the story behind the piece and where to learn more.'],
  ['How are the partner products chosen?', 'Brands partner with the event and we say so on every card. Editors choose what appears, and a partner never reviews our copy.'],
  ['I am a model or an agent. How do I attend?', 'Choose "Model scout / agent" in the invitation form. Casting call access is confirmed by email within a week.'],
  ['Is there a dress code?', 'Come as you are, and wear something you love. Black-tie optional for the opening gala and the finale.'],
];

/** A portrait: soft gradient, head and shoulders silhouette. */
export function portrait(hue: number, label = ''): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},45%,70%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},55%,28%)"/></linearGradient></defs><rect width="300" height="400" fill="url(#g)"/><circle cx="150" cy="150" r="58" fill="hsl(${hue},30%,14%)" opacity=".82"/><path d="M40 400 C40 290 90 245 150 245 C210 245 260 290 260 400Z" fill="hsl(${hue},30%,14%)" opacity=".82"/>${label ? `<text x="150" y="385" text-anchor="middle" font-family="serif" font-size="18" fill="white" opacity=".8">${label.replace(/[<&]/g, '')}</text>` : ''}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** A product still life for the partner cards. */
export function still(p: Partner): string {
  const fg = `hsl(${p.hue},35%,92%)`;
  const shapes = [
    `<rect x="115" y="120" width="90" height="140" rx="12" fill="${fg}"/><rect x="140" y="85" width="40" height="40" rx="6" fill="${fg}"/>`,
    `<path d="M70 190 Q160 110 250 190 L240 260 H80Z" fill="${fg}"/>`,
    `<circle cx="115" cy="180" r="42" fill="none" stroke="${fg}" stroke-width="12"/><circle cx="205" cy="180" r="42" fill="none" stroke="${fg}" stroke-width="12"/><path d="M157 178h6" stroke="${fg}" stroke-width="12"/>`,
    `<rect x="148" y="70" width="24" height="170" rx="12" fill="${fg}" transform="rotate(25 160 160)"/>`,
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><defs><radialGradient id="g" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="hsl(${p.hue},50%,60%)"/><stop offset="1" stop-color="hsl(${p.hue},55%,22%)"/></radialGradient></defs><rect width="320" height="320" fill="url(#g)"/>${shapes[p.shape]}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
