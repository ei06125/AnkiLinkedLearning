# Architecture

`SourceCode/apps/extension/` contains the Chrome Manifest V3 side panel, background worker, styles, and injected transcript extractor. `SourceCode/libs/core.js` contains sentence splitting, kanji enumeration, card creation, HTML escaping, and Anki export.

The toolbar opens the panel. A capture request injects the extractor into the active LinkedIn Learning tab. Captured text is split into sentences, selected text becomes cards, and the panel stores lessons and cards in Chrome local storage. Browser previews use localStorage. Export creates a local UTF-8 download.

`Configs/` owns the Chrome manifest. `Assets/` owns images and audio. `Tests/` separates unit and packaging acceptance checks. `Tools/` owns developer helpers. `Documentation/` separates product, legal, technical, and governance information. `.github/` owns CI and repository automation.

The extension has no server, translation service, or external runtime dependency. It requests activeTab, scripting, storage, and sidePanel permissions.
