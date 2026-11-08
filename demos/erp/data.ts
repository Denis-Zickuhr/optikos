// Deterministic fake data for the ERP demo (same numbers on every load, so screenshots and bug reports are comparable).
export type Row = Record<string, any>;

let seed = 20261108;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
const int = (min: number, max: number) => Math.floor(min + rnd() * (max - min + 1));
const money = (min: number, max: number) => Math.round((min + rnd() * (max - min)) * 100) / 100;
const day = (back: number, spread = 0) => {
  const d = new Date(Date.UTC(2026, 10, 8) - (back - int(0, spread)) * 864e5);
  return d.toISOString().slice(0, 10);
};
const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 864e5).toISOString().slice(0, 10);
const pad = (n: number, w = 4) => String(n).padStart(w, '0');

const companyA = ['Northwind', 'Contoso', 'Fabrikam', 'Tailspin', 'Wingtip', 'Litware', 'Adatum', 'Proseware', 'Lucerne', 'Margie', 'Coho', 'Alpine', 'Baldwin', 'Humongous', 'Trey', 'Southridge', 'Blue Yonder', 'Fourth Coffee', 'Woodgrove', 'Relecloud'];
const companyB = ['Trading', 'Industries', 'Logistics', 'Foods', 'Systems', 'Partners', 'Holdings', 'Group', 'Supplies', 'Labs'];
const cities = ['São Paulo', 'Lisboa', 'Madrid', 'Berlin', 'Chicago', 'Toronto', 'Rotterdam', 'Milan', 'Dublin', 'Singapore', 'Dubai', 'Sydney'];
const countries: Record<string, string> = { 'São Paulo': 'BR', Lisboa: 'PT', Madrid: 'ES', Berlin: 'DE', Chicago: 'US', Toronto: 'CA', Rotterdam: 'NL', Milan: 'IT', Dublin: 'IE', Singapore: 'SG', Dubai: 'AE', Sydney: 'AU' };
const first = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Felipe', 'Gabriela', 'Hugo', 'Isabel', 'João', 'Karen', 'Lucas', 'Marta', 'Nuno', 'Olívia', 'Paulo', 'Rita', 'Samuel', 'Teresa', 'Vítor'];
const last = ['Almeida', 'Barros', 'Cardoso', 'Duarte', 'Esteves', 'Ferraz', 'Gomes', 'Henriques', 'Lopes', 'Machado', 'Nogueira', 'Oliveira', 'Pinto', 'Ramos', 'Silva', 'Teixeira'];
const person = () => `${pick(first)} ${pick(last)}`;

export const ownerNames = Array.from({ length: 12 }, () => person());

export const users: Row[] = Array.from({ length: 45 }, (_, i) => {
  const name = i === 0 ? 'Ada Lovelace' : person();
  return {
    id: i + 1, name, email: `${name.toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').replace(/ /g, '.')}@northbridge.example`,
    role: i === 0 ? 'Admin' : pick(['Admin', 'Manager', 'Manager', 'Analyst', 'Analyst', 'Analyst', 'Viewer']),
    department: pick(['Finance', 'Sales', 'Purchasing', 'Operations', 'IT', 'Warehouse']),
    status: pick(['active', 'active', 'active', 'active', 'locked', 'invited']), mfa: rnd() > 0.25, lastLogin: day(int(0, 40)),
  };
});
for (const u of users) ownerNames.push(u.name);

export const customers: Row[] = Array.from({ length: 240 }, (_, i) => {
  const city = pick(cities);
  return {
    id: i + 1, code: `C-${pad(i + 1)}`, name: `${pick(companyA)} ${pick(companyB)} ${i % 7 ? '' : 'Ltd'}`.trim(), segment: pick(['Enterprise', 'Retail', 'Retail', 'Government', 'Startup']),
    city, country: countries[city], status: pick(['active', 'active', 'active', 'active', 'hold', 'inactive']),
    creditLimit: pick([5000, 10000, 25000, 50000, 100000]), balance: money(0, 40000), since: day(int(30, 2500)), owner: pick(ownerNames),
  };
});

export const suppliers: Row[] = Array.from({ length: 60 }, (_, i) => {
  const city = pick(cities);
  return {
    id: i + 1, code: `S-${pad(i + 1, 3)}`, name: `${pick(companyA)} ${pick(['Components', 'Materials', 'Packaging', 'Freight', 'Tools'])}`, category: pick(['Raw materials', 'Packaging', 'Freight', 'Services', 'Equipment']),
    country: countries[city], rating: int(1, 5), terms: pick(['Net 15', 'Net 30', 'Net 45', 'Net 60']), status: pick(['approved', 'approved', 'approved', 'pending', 'blocked']),
  };
});

export const products: Row[] = Array.from({ length: 300 }, (_, i) => {
  const cost = money(2, 400);
  const stock = int(0, 900);
  return {
    id: i + 1, sku: `SKU-${pad(i + 1, 5)}`, name: `${pick(['Premium', 'Standard', 'Compact', 'Industrial', 'Eco'])} ${pick(['Widget', 'Bracket', 'Sensor', 'Valve', 'Panel', 'Cable', 'Gasket', 'Module'])} ${pick(['A', 'B', 'C', 'X', 'Z'])}${int(1, 99)}`,
    category: pick(['Hardware', 'Electronics', 'Consumables', 'Packaging', 'Spare parts']), price: Math.round(cost * (1.2 + rnd()) * 100) / 100, cost, stock, reorder: pick([20, 50, 100, 200]),
    status: stock === 0 ? 'out of stock' : stock < 40 ? 'low' : 'in stock',
  };
});

export const orders: Row[] = Array.from({ length: 600 }, (_, i) => {
  const c = pick(customers);
  const date = day(int(0, 220));
  return {
    id: i + 1, number: `SO-${1000 + i}`, customer: c.name, date, due: addDays(date, pick([7, 14, 30])), total: money(120, 48000), items: int(1, 24),
    status: pick(['draft', 'confirmed', 'confirmed', 'shipped', 'shipped', 'delivered', 'delivered', 'delivered', 'cancelled']), channel: pick(['Web', 'EDI', 'Sales rep', 'Phone']), owner: pick(ownerNames),
  };
});

export const invoices: Row[] = Array.from({ length: 500 }, (_, i) => {
  const o = orders[i % orders.length];
  const issued = addDays(o.date, int(1, 5));
  const status = pick(['open', 'open', 'paid', 'paid', 'paid', 'overdue', 'overdue', 'void']);
  const amount = o.total;
  return {
    id: i + 1, number: `INV-${20000 + i}`, order: o.number, customer: o.customer, issued, due: addDays(issued, pick([15, 30, 45])), amount,
    paid: status === 'paid' ? amount : status === 'open' ? (rnd() > 0.7 ? Math.round(amount * 0.4) : 0) : status === 'overdue' ? Math.round(amount * rnd() * 0.3) : 0, status,
    currency: pick(['USD', 'USD', 'EUR', 'BRL']),
  };
});

export const purchases: Row[] = Array.from({ length: 300 }, (_, i) => {
  const date = day(int(0, 200));
  return {
    id: i + 1, number: `PO-${5000 + i}`, supplier: pick(suppliers).name, date, expected: addDays(date, pick([5, 10, 21, 30])), total: money(300, 60000),
    status: pick(['requested', 'approved', 'ordered', 'ordered', 'received', 'received', 'cancelled']), buyer: pick(ownerNames),
  };
});

const jobNames = ['Nightly invoicing', 'Stock reconciliation', 'Currency rates sync', 'Customer statements', 'Backup — database', 'Reorder suggestions', 'EDI import', 'Ledger close', 'Search reindex', 'Email digests'];
export const jobs: Row[] = Array.from({ length: 150 }, (_, i) => ({
  id: i + 1, name: pick(jobNames), queue: pick(['default', 'finance', 'integrations', 'maintenance']), status: pick(['done', 'done', 'done', 'done', 'running', 'queued', 'failed']),
  started: `${day(int(0, 6))} ${pad(int(0, 23), 2)}:${pad(int(0, 59), 2)}`, duration: int(2, 900), attempts: pick([1, 1, 1, 2, 3]), owner: pick(['scheduler', 'scheduler', 'system', pick(ownerNames)]),
}));
