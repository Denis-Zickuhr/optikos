# Contributing

Thanks for your interest in Optikos. Read [PHILOSOPHY.md](PHILOSOPHY.md) and the project rules in
[AGENTS.md](AGENTS.md) first. Planning docs and component spec sheets are written in Portuguese;
code, APIs and identifiers are in English.

## Setup

```sh
npm install
npm run dev     # sandboxes and demos at http://localhost:5173/dev/
```

## Before opening a pull request

- `npm run check` passes (generated index, typecheck, tests and build with size budgets).
- No new runtime dependency. Dev tools go in `devDependencies`.
- Styles use tokens only and live in `@layer optikos`.
- Keyboard and ARIA work, and the component has a sandbox case.

## Adding a component

```sh
npm run new:component -- <category> <name>
```

This creates the spec sheet (`docs/components/<name>.md`), the `.ts`, `.css` and test files and a sandbox section.
Fill in the spec sheet before writing the code. The full checklist is in [AGENTS.md](AGENTS.md).

## Reporting bugs

Open an issue at https://github.com/Denis-Zickuhr/optikos/issues with the Optikos version, the browser and a minimal config that reproduces it.
