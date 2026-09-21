# AnkiLinkedLearning

A Chrome extension that turns Japanese LinkedIn Learning transcripts into contextual Anki cards. Capture lessons as you visit them, select kanji or words, and keep the surrounding sentence.

## Install

Requires Node.js 22 or newer, npm, and Chrome 114 or newer.

```sh
git clone git@github.com:ei06125/AnkiLinkedLearning.git
cd AnkiLinkedLearning
npm run verify
```

No npm dependencies need installing. In Chrome, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `.build/extension/` inside the project. Rebuild and reload the extension after changing source files.

## Use

1. Open a Japanese LinkedIn Learning lesson and select its **Transcript** tab.
2. Click the extension’s toolbar icon and choose **Capture current transcript**.
3. Click a kanji to find matching sentences, then add a sentence. Alternatively, highlight a word within one sentence and choose **Add selection**.
4. Enter the kanji reading and full sentence translation. Preview the card and choose a deck name.
5. Select **Export for Anki**. In Anki Desktop, use **File → Import** and select the downloaded `.txt` file with the **Basic** note type.

The default card front contains the kanji and sentence. The back contains the kanji, reading, sentence, translation, and source lesson. Anki creates the named deck during import. No Anki plugin is needed.

Captured lessons and cards stay in browser storage on this device. Readings and translations are currently manual. Use **Paste a transcript instead** if extraction fails, or **Try a sample** to explore the interface. The extension collects individual lessons, not entire courses automatically.

## Development

```sh
npm run check
npm test
npm run build
```

`npm run verify` runs all three. Install `pre-commit`, `gitleaks`, and `detect-secrets` (including `detect-secrets-hook`), then run:

```sh
npm run hooks:install
npm run security
```

Both pre-commit and pre-push hooks run verification and secret detection. GitHub workflows verify the build, upload the unpacked extension, and scan for secrets. They do not publish the extension.

## Project layout

```text
Assets/          Images and audio
Configs/         Chrome extension manifest
Documentation/   Product, legal, technical, and governance documents
References/      Saved pages used to inspect LinkedIn’s markup
SourceCode/      Extension application and shared logic
Tests/           Unit and packaging acceptance tests
Tools/           Build and verification helpers
.github/         CI workflows and dependency-update configuration
.build/          Generated extension; ignored by Git
```

`package.json` remains at the root for npm and ES module discovery. `References/` is an optional local directory, excluded from Git and extension builds because saved authenticated pages can contain credentials and personal data. The ignore rules derive from gitignore.io’s Node, operating-system, and VS Code templates, with project-specific additions.

The saved Event Hubs page uses `.classroom-transcript__lines .content-transcript-line` anchors and `.classroom-transcript__title` for the lesson title. Capture supports this structure and older transcript selectors. LinkedIn may change its markup; authenticated live capture and Anki Desktop import still require manual verification.

See [building](Documentation/Technical/BUILDING.md), [architecture](Documentation/Technical/ARCHITECTURE.md), [testing](Documentation/Technical/TESTING.md), [deployment](Documentation/Technical/DEPLOYING.md), and [contributing](Documentation/Governance/CONTRIBUTING.md).

## License

A license has not been selected. See [license status](Documentation/Legal/LICENSE).
