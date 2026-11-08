// Fake data for the photo demo: deterministic, with generated SVG "photos" so it needs no images and no network.
export type Row = Record<string, any>;

let seed = 8112026;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
const int = (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1));
const day = (back: number) => new Date(Date.UTC(2026, 10, 8) - back * 864e5).toISOString().slice(0, 10);

/** A landscape-ish picture as an SVG data URI: sky gradient, a sun, and one of four scenes. */
export function thumb(hue: number, variant: number, label = ''): string {
  const sky2 = (hue + 40) % 360;
  const scenes = [
    // mountains
    `<polygon points="0,300 90,150 170,240 260,110 360,230 400,200 400,300" fill="hsl(${hue},35%,26%)"/><polygon points="0,300 140,200 230,270 320,180 400,260 400,300" fill="hsl(${hue},40%,18%)"/>`,
    // beach
    `<rect y="190" width="400" height="110" fill="hsl(${(hue + 170) % 360},55%,38%)"/><path d="M0 240 Q100 215 200 240 T400 240 V300 H0Z" fill="hsl(40,55%,72%)"/>`,
    // city
    `<g fill="hsl(${hue},30%,16%)"><rect x="20" y="130" width="50" height="170"/><rect x="80" y="80" width="60" height="220"/><rect x="150" y="150" width="45" height="150"/><rect x="205" y="100" width="70" height="200"/><rect x="285" y="140" width="55" height="160"/><rect x="345" y="170" width="55" height="130"/></g>`,
    // forest
    `<g fill="hsl(${(hue + 100) % 360},45%,22%)"><polygon points="0,300 40,150 80,300"/><polygon points="60,300 110,110 160,300"/><polygon points="140,300 190,160 240,300"/><polygon points="220,300 280,100 340,300"/><polygon points="310,300 360,150 410,300"/></g>`,
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue},70%,62%)"/><stop offset="1" stop-color="hsl(${sky2},75%,78%)"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><circle cx="${90 + (variant % 3) * 110}" cy="80" r="34" fill="hsl(48,95%,75%)" opacity=".9"/>${scenes[variant % 4]}${label ? `<text x="14" y="288" font-family="sans-serif" font-size="14" fill="white" opacity=".85">${label.replace(/[<&]/g, '')}</text>` : ''}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const albums = ['Trips', 'Family', 'Pets', 'Work', 'Food', 'Uploads'];
const titles: Record<string, string[]> = {
  Trips: ['Sunrise at the ridge', 'Old town streets', 'Harbour at dusk', 'Train window', 'Market morning', 'Cliffs', 'Night skyline'],
  Family: ['Birthday candles', 'Sunday lunch', 'Garden games', 'Grandma\'s kitchen', 'Road trip snacks', 'First day of school'],
  Pets: ['Luna in the sun', 'Bento sleeping', 'Muddy paws', 'Park run', 'Window watch'],
  Work: ['Whiteboard session', 'Launch day', 'Team offsite', 'Desk setup', 'Conference stage'],
  Food: ['Fresh bread', 'Ramen night', 'Farmers market', 'Pasta from scratch', 'Brunch table'],
};
const people = ['Marina Costa', 'Tiago Ramos', 'Júlia Prado', 'Diego Lima', 'Helena Alves', 'Caio Mendes'];
export const me = 'You';

export interface Photo { id: number; title: string; album: string; takenAt: string; size: number; kind: 'photo' | 'video'; favorite: boolean; backup: 'synced' | 'pending' | 'failed'; shared: boolean; tags: string[]; hue: number; variant: number; src: string; duration?: number; dateLabel: string }

export const photos: Photo[] = [];
for (const album of albums.filter((a) => a !== 'Uploads')) {
  const n = album === 'Trips' ? 26 : album === 'Family' ? 22 : album === 'Pets' ? 16 : album === 'Work' ? 14 : 18;
  for (let i = 0; i < n; i++) {
    const id = photos.length + 1;
    const hue = int(0, 359);
    const variant = int(0, 3);
    const takenAt = day(int(1, 400));
    const kind = rnd() > 0.88 ? 'video' : 'photo';
    photos.push({
      id, title: pick(titles[album]), album, takenAt, size: Math.round((kind === 'video' ? 20 + rnd() * 200 : 1.5 + rnd() * 9) * 10) / 10, kind,
      favorite: rnd() > 0.82, backup: pick(['synced', 'synced', 'synced', 'synced', 'pending', 'failed'] as const), shared: rnd() > 0.88,
      tags: [pick(['golden hour', 'portrait', 'macro', 'panorama', 'night', 'candid']), album.toLowerCase()], hue, variant, src: thumb(hue, variant), duration: kind === 'video' ? int(5, 140) : undefined, dateLabel: takenAt,
    });
  }
}
photos.sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1));
photos.forEach((p, i) => (p.id = i + 1));

export interface FileRow { id: number; name: string; folder: string; type: string; size: number; modified: string; backup: 'synced' | 'pending' | 'failed'; shared: boolean }
const fileNames = ['Passport scan', 'Invoice March', 'Trip itinerary', 'Insurance policy', 'Lease agreement', 'Tax return 2025', 'Receipts', 'Project brief', 'Meeting notes', 'Photo contact sheet', 'Wedding budget', 'Recipe book', 'Resume', 'Warranty cards', 'Medical results', 'Course certificate'];
export const files: FileRow[] = Array.from({ length: 48 }, (_, i) => {
  const type = pick(['pdf', 'docx', 'xlsx', 'zip', 'png', 'txt'] as const);
  return { id: i + 1, name: `${pick(fileNames)}${i > 15 ? ` (${i - 14})` : ''}.${type}`, folder: pick(['Documents', 'Documents', 'Receipts', 'Work', 'Travel', 'Archive']), type, size: Math.round((type === 'zip' ? 4000 + rnd() * 80000 : 40 + rnd() * 4000)), modified: day(int(0, 300)), backup: pick(['synced', 'synced', 'synced', 'pending', 'failed'] as const), shared: rnd() > 0.85 };
});

export interface Share { id: number; item: string; kind: 'photo' | 'album' | 'file'; with: string; permission: 'view' | 'comment' | 'edit'; link: boolean; expires: string; created: string; views: number; direction: 'by' | 'with' }
export const shares: Share[] = Array.from({ length: 22 }, (_, i) => {
  const kind = pick(['photo', 'album', 'file'] as const);
  const direction = i % 3 === 0 ? 'with' : 'by';
  return { id: i + 1, item: kind === 'album' ? pick(albums) : kind === 'file' ? pick(files).name : pick(photos).title, kind, with: direction === 'with' ? pick(people) : rnd() > 0.35 ? pick(people) : 'Anyone with the link', permission: pick(['view', 'view', 'comment', 'edit'] as const), link: rnd() > 0.5, expires: rnd() > 0.5 ? day(-int(5, 90)) : '', created: day(int(1, 120)), views: int(0, 240), direction };
});

export const devices = [
  { id: 1, name: 'Personal phone', os: 'Android 15', lastBackup: '2026-11-08 07:42', status: 'syncing', pending: 37, size: 18.4 },
  { id: 2, name: 'Studio laptop', os: 'macOS 15', lastBackup: '2026-11-07 22:10', status: 'up to date', pending: 0, size: 42.9 },
  { id: 3, name: 'Kitchen tablet', os: 'iPadOS 18', lastBackup: '2026-10-29 19:03', status: 'attention', pending: 212, size: 9.1 },
];

export interface Comment { from: string; text: string; time: number }
export interface Post { id: number; author: string; hue: number; photoId: number; caption: string; createdAt: number; likes: number; liked: boolean; comments: Comment[] }
const caps = ['Golden hour never disappoints.', 'Found this view after a two-hour climb 🥾', 'Sunday lunch, the usual chaos ❤️', 'Who else loves rainy-day photography?', 'Behind the scenes from last week\'s shoot', 'Trying a new editing style, thoughts?', 'Little one discovers the garden', 'The light in this city is unreal.', 'Weekend market haul', 'Throwback to the best trip of the year'];
const replies = ['Gorgeous shot!', 'Love the colours here', 'What lens was that?', 'This made my day 😍', 'Where is this?', 'The composition is perfect', 'Need to go there next year', 'Great editing!'];
const now = Date.UTC(2026, 10, 8, 12);
export const posts: Post[] = Array.from({ length: 14 }, (_, i) => {
  const author = i === 3 ? me : pick(people);
  const comments: Comment[] = Array.from({ length: int(0, 5) }, (_, k) => ({ from: pick(people), text: pick(replies), time: now - (i * 5 + 8 - k) * 36e5 }));
  const ph = photos[(i * 7) % photos.length];
  return { id: i + 1, author, hue: ph.hue, photoId: ph.id, caption: caps[i % caps.length], createdAt: now - i * 5 * 36e5, likes: int(2, 120), liked: rnd() > 0.7, comments };
});
export const community = people;

export const bytes = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`);
export const kb = (k: number) => (k >= 1024 ? `${(k / 1024).toFixed(1)} MB` : `${k} KB`);
