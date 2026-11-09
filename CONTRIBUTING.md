# Contributing

Thanks for your interest in Optikos. Read [PHILOSOPHY.md](PHILOSOPHY.md) and the project rules in
[AGENTS.md](AGENTS.md) first. Code, APIs, spec sheets and guides are in English, with a Portuguese translation in
`docs/pt-BR/` kept in the same commit; planning notes (`docs/internal/`) and the decision log (`docs/architecture.md`)
are in Portuguese.

## Setup

```sh
npm install
npm run dev     # sandboxes and demos at http://localhost:5173/dev/
```

## Before opening a pull request

- `npm run check` passes (generated index, typecheck, tests and build with size budgets).
- `npm run test:browser` passes when you touch focus, keyboard, layout or anything measured (real Chromium through
  Playwright; install it once with `npx playwright install chromium`, or `--with-deps` on a bare Linux).
- No new runtime dependency. Dev tools go in `devDependencies`.
- Styles use tokens only and live in `@layer optikos`.
- Keyboard and ARIA work, and the component has a sandbox case.

## Adding a component

```sh
npm run new:component -- <category> <name>
```

This creates the spec sheet (`docs/components/<name>.md` and `docs/pt-BR/components/<name>.md`), the `.ts`, `.css` and
test files and a sandbox section. Fill in the spec sheet before writing the code, and add an example to `site/examples.json`. The full checklist is in [AGENTS.md](AGENTS.md).

## Releasing

Publishing to npm only happens from a version tag. CI (`.github/workflows/ci.yml`) runs `npm run check` on every push
and pull request; pushing a tag `v<version>` runs `.github/workflows/release.yml`, which publishes that version to npm
and then deploys the docs site to GitHub Pages.

1. Add the new version's entry to `CHANGELOG.md` and commit it.
2. `npm version patch` (or `minor` / `major`): bumps `package.json` and the lockfile, commits and creates the tag `v<version>`.
3. `git push --follow-tags`.

`npm run release` locally is a dry run. `scripts/release.mjs` refuses a real publish unless the current commit is
tagged `v<package.json version>` and the working tree is clean. The docs site alone can be redeployed by running the
Release workflow by hand (Actions → Release → Run workflow); that never publishes to npm.

## Reporting bugs

Open an issue at https://github.com/Denis-Zickuhr/optikos/issues with the Optikos version, the browser and a minimal config that reproduces it.
