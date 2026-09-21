# Contributing

Remote: `git@github.com:ei06125/AnkiLinkedLearning.git`.

Install Node.js 22+, pre-commit, Gitleaks, and detect-secrets with its `detect-secrets-hook` command. Then run `npm run hooks:install` in the Git checkout. Both pre-commit and pre-push hooks are installed. Local hooks use these installed tools and fail if a required command is missing.

Pre-commit scans staged changes with Gitleaks and changed files with detect-secrets, then runs checks, tests, and build. Pre-push scans all Git history with Gitleaks, checks changed files with detect-secrets, and repeats verification. CI independently checks tracked files and history.

Run `npm run security` for a working-directory scan. Never commit credentials, transcript exports, or personal browser artifacts. Report suspected credentials privately to the repository owner and rotate exposed credentials.

Never skip hooks. Commit, push, and pull-request creation require explicit instruction. A project license is pending owner selection.

Tool references: [pre-commit](https://pre-commit.com/), [Gitleaks](https://github.com/gitleaks/gitleaks), [detect-secrets](https://github.com/Yelp/detect-secrets).
