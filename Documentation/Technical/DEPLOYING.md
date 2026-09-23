# Deploying

Run `npm run verify`. In Chrome, visit `chrome://extensions`, enable Developer mode, select Load unpacked, and choose `OutDir/extension/`. After rebuilding, reload the extension there.

GitHub CI uploads the assembled extension as an artifact. Download and extract it, then choose the directory containing `manifest.json` when loading unpacked.

Nothing is published automatically. Before a Chrome Web Store release, choose a license, provide store assets and privacy disclosures, verify live LinkedIn capture and Anki import, and review requested permissions. Packaging and store submission require a separate release task.
