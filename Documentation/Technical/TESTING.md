# Testing

Run `npm test` for unit and packaging acceptance tests. Run `npm run check` for JavaScript syntax checks. Run `npm run verify` for the complete check/test/build sequence.

Unit tests cover sentence boundaries, Unicode kanji, Japanese word segmentation, dictionary and translation response handling, context preservation, HTML escaping, export formatting, card layout, and fixture-based transcript extraction. Acceptance tests build the extension and verify its packaged entry points and shared modules.

The saved Event Hubs page in `References/` was checked in a browser using its isolated transcript markup, without executing saved third-party scripts. Extraction returned all 80 transcript anchors and the correct lesson title, excluding accessibility instructions. Regression tests cover the classroom anchor selector and lesson-title fallbacks. Reference files are not packaged with the extension.

Manual acceptance: load `OutDir/extension/` in Chrome, capture an authenticated Japanese LinkedIn Learning transcript, switch between the Words, Individual kanji, and Transcript tabs, confirm only one pane is visible, and verify the Transcript tab scrolls independently. Select each target type and check the corresponding highlights in both the captured and LinkedIn transcripts. Close the panel and confirm the page highlight disappears; reopen it and confirm only selecting a target restores highlighting. Confirm the capture disappears when the panel session ends while cards remain. Verify notices disappear after five seconds and only the current card appears in the deck builder. Review automatic readings and translations, preview, export, open the export folder, and import into Anki Desktop. Real Anki import remains a manual check.

Add end-to-end, performance, fuzzing, mutation, or BDD suites under `Tests/` when implemented; empty suites do not imply coverage.
