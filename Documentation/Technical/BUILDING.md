# Building

Requires Node.js 22 or newer and npm. Install the TypeScript compiler and Chrome API type declarations with `npm install`.

From the repository root:

```sh
npm run verify
```

`npm run build` compiles `SourceCode/**/*.ts` to JavaScript in the temporary `.build/SourceCode/` tree, then assembles the manifest, compiled JavaScript, panel HTML/CSS, and assets into `OutDir/extension/`. Both generated directories are replaced on each build. Load `OutDir/extension/` in Chrome and rebuild after source changes. TypeScript and source maps are never packaged.

`package.json` stays at the repository root because npm and Node use it for command discovery and ES module interpretation. Other application configuration belongs in `Configs/`; tool-discovered dotfiles remain at the root.
