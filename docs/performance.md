# Performance

Measured with `npm run bench`: `scripts/bench.ts` runs in a real Chromium (Playwright), each case once to warm up and
then 7 times; the table shows the median. Numbers depend on the machine; compare runs on the same one.

**2026-11-09** · Chromium 158 (headless) · Intel Core i7-13620H · Linux (WSL2) · 100 000 records of 4 fields

| Case | Median |
|---|---|
| Store: load 100k records | 8.3 ms |
| Store: sort 100k by text (numeric-aware collation) | 413 ms |
| Store: filter 100k (`contains`) | 7.8 ms |
| Grid: mount over 100k rows until the first paint | 28.6 ms |
| Grid: jump-scroll across 100k rows | 16.7 ms per jump (one frame: it keeps up at 60 fps) |
| Form: create, render and destroy 1000 fields | 153 ms |
| Form: validate 1000 fields, marking every error | 38 ms |

## What the numbers say

- **The Grid cost does not grow with the data.** Mounting over 100k rows takes about as long as over 100: the grid keeps
  a pool of row nodes the size of the viewport (see `core/virtual.ts`).
- **Sorting text is the expensive operation.** It uses one shared `Intl.Collator` with numeric ordering (`Item 2` before
  `Item 10`). Before the collator was cached, the same sort took 5.4 s, because `localeCompare` with options builds a
  collator on every comparison. For very large local data sets, sort on the server (`remote: true`).
- **Forms are linear.** 1000 fields is far beyond a real screen; a typical form (20–50 fields) is a few milliseconds.

## Adding a case

Add a function to `cases` in `scripts/bench.ts` that returns the milliseconds of the operation, then run `npm run bench`
and update the table with the date and machine. Benchmarks do not run in CI: shared runners are too noisy to fail on.
