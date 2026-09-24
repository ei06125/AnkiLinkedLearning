# Repository Guidelines

## LAWS

- Never work on `main` branch.
- Never print nor push API keys, credentials, secrets or tokens.

## Project Structure & Module Organization

AnkiLinkedLearning is a Chrome extension written in TypeScript and compiled to native ES modules.

- `SourceCode/apps/extension/`: side-panel UI, transcript capture, tab detection, and video synchronization.
- `SourceCode/libs/`: reusable card, dictionary, and translation logic.
- `Configs/manifest.json`: source Chrome manifest.
- `Tests/unit/` and `Tests/acceptance/`: Node test suites and packaging checks.
- `Tools/scripts/`: build, syntax, and privacy checks.
- `Assets/`, `Documentation/`, and `Infrastructure/`: media, project documentation, and GitHub Terraform configuration.
- `OutDir/extension/`: generated unpacked extension; do not edit or commit it.
- `References/`: local, gitignored research material that may contain authenticated or machine-specific data.

## Build, Test, and Development Commands

Requires Node.js 22 or newer. Install development dependencies with `npm ci`.

- `npm run build`: compile TypeScript and assemble the unpacked extension in `OutDir/extension/`.
- `npm test`: compile TypeScript and run all Node unit and acceptance tests.
- `npm run check`: syntax-check scripts and strictly type-check TypeScript sources.
- `npm run verify`: run checks, tests, and the build.
- `npm run privacy`: scan tracked files for absolute paths and machine identity values.
- `npm run security`: scan the repository with Gitleaks.
- `npm run hooks:install`: install configured pre-commit and pre-push hooks.

After rebuilding, reload the unpacked extension from `chrome://extensions`.

## Coding Style & Naming Conventions

Use two-space indentation, semicolons, single quotes, and ESM `import`/`export`. Prefer small functions and existing browser APIs over new dependencies. Use `camelCase` for variables and functions, `PascalCase` only for classes, and lowercase descriptive filenames such as `capture.ts`. Avoid unexplained magic values in tests; name fixtures and use realistic LinkedIn Learning URLs.

## Testing Guidelines

Tests use `node:test` with `node:assert/strict`. Name files `*.test.js` and describe observable behavior in each test title. Add regression tests for bug fixes, including the failing condition and expected recovery. Run `npm run verify` before submission. No numeric coverage threshold is enforced.

## Commit & Pull Request Guidelines

Use short imperative commit subjects, for example `Reset study session when video changes`. Never amend, force-push, or bypass hooks. Keep commits scoped to one concern. Pull requests should explain the outcome, list validation performed, link relevant issues, and include screenshots for visible UI changes. Resolve conflicts against `main` and ensure required `verify` and `secrets` checks pass.

## Security & Configuration

Use repository-relative paths. Keep credentials, saved authenticated pages, generated output, Terraform state, and machine-local files untracked. Add unavoidable local artifacts to `.gitignore`.
