# Testing

Run `npm test` for unit and packaging acceptance tests. Run `npm run check` for JavaScript syntax checks. Run `npm run verify` for the complete check/test/build sequence.

Unit tests cover sentence boundaries, Unicode kanji, context preservation, HTML escaping, export formatting, card layout, and fixture-based transcript extraction. Acceptance tests build the extension and verify its packaged entry points and shared module.

The saved Event Hubs page in `References/` was checked in a browser using its isolated transcript markup, without executing saved third-party scripts. Extraction returned all 80 transcript anchors and the correct lesson title, excluding accessibility instructions. Regression tests cover the classroom anchor selector and lesson-title fallbacks. Reference files are not packaged with the extension.

Manual acceptance: load `.build/extension/` in Chrome, capture an authenticated Japanese LinkedIn Learning transcript, select kanji and a multi-character word, enter readings and translations, preview, reopen the panel, export, and import into Anki Desktop. Confirm front/back layout and source links. Live capture and real Anki import remain manual checks.

Add end-to-end, performance, fuzzing, mutation, or BDD suites under `Tests/` when implemented; empty suites do not imply coverage.
