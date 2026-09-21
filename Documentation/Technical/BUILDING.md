# Building

Requires Node.js 22 or newer and npm. Runtime and build have no external package dependencies.

From the repository root:

```sh
npm run verify
```

The build assembles `Configs/manifest.json`, `SourceCode/`, and `Assets/` into `.build/extension/`. Load that generated folder in Chrome. Rebuild after source changes. The build updates files without deleting older artifacts; use a fresh checkout for distribution builds.

`package.json` stays at the repository root because npm and Node use it for command discovery and ES module interpretation. Other application configuration belongs in `Configs/`; tool-discovered dotfiles remain at the root.
