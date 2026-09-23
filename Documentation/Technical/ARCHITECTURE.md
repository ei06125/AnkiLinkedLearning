# Architecture

`SourceCode/apps/extension/` contains the Chrome Manifest V3 side panel, background worker, styles, and injected transcript extractor. `SourceCode/libs/core.js` contains sentence splitting, kanji and word enumeration, card creation, HTML escaping, and Anki export. `SourceCode/libs/dictionary.js` performs selected-word lookup through Jisho. `SourceCode/libs/translation.js` translates selected card sentences through MyMemory.

The toolbar opens the panel. A capture request injects the extractor into the active LinkedIn Learning tab. Captured text is held in panel memory for the current session and split into sentences and Japanese words using `Intl.Segmenter`; the next capture replaces it. Words and individual kanji use exclusive tabs and one shared selection. Selected text becomes cards. The panel stores cards and deck preferences in Chrome local storage under `kanjiLearning`; captured transcripts are not stored. Browser previews use localStorage. Export creates a local UTF-8 download through Chrome’s normal download handling.

Selecting a target asks the active LinkedIn Learning page to wrap matching text inside visible transcript lines with temporary highlight elements. A new target or “Show all” removes the previous highlight. LinkedIn page changes can prevent this enhancement without affecting the extension’s own filtered transcript.

`Configs/` owns the Chrome manifest. `Assets/` owns images and audio. `Tests/` separates unit and packaging acceptance checks. `Tools/` owns developer helpers. `Documentation/` separates product, legal, technical, and governance information. `.github/` owns CI and repository automation.

The extension has no server of its own. It requests scripting, storage, sidePanel, LinkedIn Learning access, Jisho word lookup, and MyMemory translation access. Selected multi-character words are sent to Jisho. Complete sentences selected for cards are sent to MyMemory for Japanese-to-English translation. Other transcript sentences and user edits remain local. Saved cards missing a translation are backfilled once the panel opens; repeated cards reuse translations by sentence where possible.
