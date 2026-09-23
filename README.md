# AnkiLinkedLearning

A Chrome extension that turns Japanese transcripts into contextual Anki cards. Capture the current LinkedIn Learning transcript, select individual kanji or detected words, and keep the surrounding sentence.

## Install

Requires Node.js 22 or newer, npm, and Chrome 114 or newer.

```sh
git clone git@github.com:ei06125/AnkiLinkedLearning.git
cd AnkiLinkedLearning
npm run verify
```

No npm dependencies need installing. In Chrome, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `OutDir/extension/` inside the project. Rebuild and reload the extension after changing source files.

## Use

1. Open a Japanese LinkedIn Learning lesson and select its **Transcript** tab.
2. Click the extension’s toolbar icon and choose **Capture current transcript**.
3. Switch between the **Words**, **Individual kanji**, and scrollable **Transcript** tabs. Choose a target to filter matching sentences and highlight it in the captured transcript, then add a sentence. The extension also highlights matching text in LinkedIn’s visible transcript when possible and removes the highlight when the panel closes. Alternatively, highlight text within one sentence and choose **Add selection**.
4. Multi-character word readings and English dictionary glosses are retrieved from Jisho. The complete sentence is translated from Japanese to English through MyMemory. Review and edit the current card, preview it, and choose a deck name.
5. Select **Export for Anki**. In Anki Desktop, use **File → Import** and select the downloaded `.txt` file with the **Basic** note type. **Open export folder** opens Chrome’s configured download folder.

The default card front contains the kanji and sentence. The back contains the kanji, reading, sentence, translation, and source lesson. Anki creates the named deck during import. No Anki plugin is needed.

The captured transcript exists only in the open side-panel session and is replaced by the next capture; it is not saved. Cards, deck name, and card format stay in Chrome extension storage on this device under the `kanjiLearning` key. Export downloads a UTF-8 `.txt` file to Chrome’s configured Downloads location. A selected multi-character word is sent to Jisho for lookup, and the selected card’s complete sentence is sent to MyMemory for Japanese-to-English translation. Other transcript sentences, cards, and edits are not sent. Use **Paste a transcript instead** if extraction fails, or **Try a sample** to explore the interface.

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
Infrastructure/  Terraform for GitHub branch and tag protection
References/      Saved pages used to inspect LinkedIn’s markup
SourceCode/      Extension application and shared logic
Tests/           Unit and packaging acceptance tests
Tools/           Build and verification helpers
.github/         CI workflows and dependency-update configuration
OutDir/          Generated extension; ignored by Git
```

`package.json` remains at the root for npm and ES module discovery. `References/` is an optional local directory, excluded from Git and extension builds because saved authenticated pages can contain credentials and personal data. The ignore rules derive from gitignore.io’s Node, operating-system, and VS Code templates, with project-specific additions.

The saved Event Hubs page uses `.classroom-transcript__lines .content-transcript-line` anchors and `.classroom-transcript__title` for the lesson title. Capture supports this structure and older transcript selectors. LinkedIn may change its markup; authenticated live capture and Anki Desktop import still require manual verification.

See [building](Documentation/Technical/BUILDING.md), [architecture](Documentation/Technical/ARCHITECTURE.md), [testing](Documentation/Technical/TESTING.md), [deployment](Documentation/Technical/DEPLOYING.md), and [contributing](Documentation/Governance/CONTRIBUTING.md).

## Repository protection

`infra/` manages two active GitHub rulesets. `main` requires a pull request, resolved review discussions, linear history, and passing `verify` and `secrets` checks from GitHub Actions against the latest base branch. Deletion and force pushes are blocked. Required approvals default to zero for a solo maintainer; set `required_approvals` to increase them. There are no bypass actors.

All existing tags are protected against updates and deletion. New tags may still be created. These rules do not constrain feature branches.

Requires Terraform 1.5+ and GitHub credentials with repository administration permission. From the repository root, using an authenticated GitHub CLI:

```sh
export GITHUB_TOKEN="$(gh auth token)"
terraform -chdir=infra init
terraform -chdir=infra fmt -check
terraform -chdir=infra validate
terraform -chdir=infra plan -out=rulesets.tfplan
terraform -chdir=infra apply rulesets.tfplan
unset GITHUB_TOKEN
```

Terraform state and plan files stay local and are ignored by Git; preserve the state securely. Commit the provider lockfile. On another checkout, restore the state or import the existing rulesets using `terraform -chdir=infra import github_repository_ruleset.main AnkiLinkedLearning:RULESET_ID` and the equivalent `github_repository_ruleset.tags` address before applying. Do not apply with empty state to a repository that already has these rulesets. Terraform manages only rulesets, not the repository itself. Destroying this configuration removes the protections.

## License

A license has not been selected. See [license status](Documentation/Legal/LICENSE).
