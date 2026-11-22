# Working on LaunchProof

Read [the development guide](docs/DEVELOPMENT.md) for the code map and security invariants.
Before changing SDK behavior, read <https://docs.deep.space/llms.txt> and the relevant documentation page as Markdown (append `.md`). Check installed package types and CLI `--help` for this pinned version.

## Source and deployment

This app permanently uses GitHub: https://github.com/sabin901/LaunchProof.
Use ordinary Git; never run `deepspace push`. Commit and push the intended changes, then deploy the clean checkout with `npx deepspace deploy`. Keep credentials and local artifacts ignored.

## Checks

- `npm run validate`: TypeScript and unit tests.
- `npm run lint`: ESLint.
- `npx deepspace test run e2e --port 5181`: browser tests with real auth and records.
- `npm run build`: production build.

Use Node 24 and npm 11.6+. This repository uses npm and package-lock.json.
Do not weaken action authorization, team-only reads, independent review, serialized decisions, or snapshot-based reports to simplify code. Keep the public landing page free of authentication and record providers.

For app tools, discover schemas using `npx deepspace agent tools <app> --json` before invocation. Never invent credentials or put passwords on the command line. External integrations are disabled unless explicitly allowlisted.
