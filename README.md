# LaunchProof

**Verify together. Ship with confidence.**

A collaborative release sign-off workspace that preserves human verification evidence and decision context. It complements CI and issue trackers: it does not execute tests, independently certify evidence, or deploy your software.

Live URL: deployment verification pending. Intended address: https://launchproof.app.space

Source: https://github.com/sabin901/LaunchProof

![LaunchProof landing](docs/landing.png)

## Use the app

1. Open the workspace and sign in with DeepSpace.
2. Create a release with a product name and version. Five production-release gates are created: build/tests, authentication, critical issues, regression smoke, and recovery.
3. Ask a colleague to sign in once and copy their reviewer ID from Releases. The release lead adds that ID to the team.
4. Record what was checked, an optional HTTP(S) evidence URL, and a verified/failed attestation. Each saved change carries the authenticated actor and server time; teammates receive live updates.
5. Approval requires all five gates with qualifying evidence, **at least one gate verified by a different active reviewer**, and an authorized lead. A lead may instead reject with a reason.
6. After a decision, evidence is read-only. The decision report renders the saved snapshot, including independent reviewer identities, even after refreshing.

## Architecture and boundaries

React + TypeScript + Tailwind, scaffolded by `create-deepspace@0.44.2`, using `deepspace@0.44.2`, Vite, native authentication, file-based routing, RecordRoom and `useQuery` subscriptions. The scaffold's `users`/`settings` schemas and provider/auth wiring are preserved. No added database, backend framework, socket server, or UI library.

| Application collection | Purpose | Client access |
| --- | --- | --- |
| releases | Release state and final evidence snapshot | Team read; no writes |
| team_members | Active release lead/reviewer memberships | Team read; no writes |
| gates | Five requirements with latest attestation | Team read; no writes |
| events | Append-only application activity | Team read; no writes |

`createRelease`, `addReviewer`, `verifyGate`, and `decideRelease` are authenticated server actions. SDK privileged tools bypass RBAC, so each release operation explicitly checks membership, state and role; evidence writes also check gate/release matching. Roles within a release are distinct from SDK app roles. Browser-supplied actor IDs and timestamps are ignored. URL schemes and string lengths are validated server-side. Direct writes are denied for both member and admin collection permissions.

The authenticated edge sends the complete action to the **same existing app RecordRoom**. `AppRecordRoom.fetch` executes its short record-only workflow inside Cloudflare `blockConcurrencyWhile`; SDK tools call the superclass locally, avoiding RPC back into a locked room. This serializes competing workflows across Worker isolates. No external integration is called within the lock. See [Cloudflare's documented behavior](https://developers.cloudflare.com/durable-objects/api/state/#blockconcurrencywhile).

Serialization is **not** a multi-record rollback transaction or a cryptographic audit guarantee. Creation remains `initializing` until all records exist and fails closed on partial creation. A process failure may leave incomplete records. The release snapshot is the primary decision record; activity failures return a warning. There is no automatic repair job. Only ordinary application operations are constrained; infrastructure operators can still modify storage. Tests exercise concurrent approval/edit and concurrent approvals, not all possible infrastructure failures.

## Local development and tests

Use Node 24 and npm 11.6+. Verified environment: Node 24.14.1, npm 11.13.0. Lockfile pins transitive dependencies.

```sh
npm ci
npx deepspace auth login
npx deepspace auth whoami --json
npx deepspace dev start
npm run type-check
npm run lint
npm run test:unit
npx deepspace test run e2e --port 5181
npm run build
```

Three usable DeepSpace test accounts are needed for all tests. Inspect `npx deepspace test accounts list --usable`, then create only missing accounts using `--password-stdin`. Credentials stay in the SDK's local credential store, never in the repository. The SDK fixture creates separate signed-in browser contexts and uses real auth and records. Tests create fictional `__test-*` releases under their own accounts; these records are retained because the application deliberately has no deletion or test-bypass endpoint.

To test an existing deployment without starting a local server, set `LAUNCHPROOF_BASE_URL` to its HTTPS origin and run `npx playwright test --config tests/playwright.config.ts`. Do not point this at an unrelated app.

Verified November 21, 2026 (America/Chicago): 10 unit tests; 19 local Playwright tests, including end-to-end browser approval, independent reviewer enforcement, three-user isolation, underlying record API denials, concurrent decision/edit, concurrent approvals, rejection, reconnect and report refresh. Typecheck, lint and production build passed. Production results will be recorded after deployment. See `BUILD_STATE.md` for actual failures and fixes.

## Source and deployment

GitHub is the requested source. Before first deployment, `deepspace status --json` must infer `github` from `origin`. Never run `deepspace push`: first source selection is permanent. Commit and push `main`, deploy the clean working tree, then compare the deployed source revision with GitHub.

`.dev.vars`, platform sessions, test credentials, local logs and test artifacts are ignored. Do not commit secrets. App identity is public configuration, not a credential.

## Deliberate tradeoffs and provenance

- One fixed production-release policy; no generic policy builder, CI fetching or deployment automation.
- Reviewer IDs provide a small existing-user handoff without exposing a public user directory or building email invitations.
- Human attestation is not proof that a referenced test passed. Supporting links are not fetched or certified.
- No optional AI/email integration was added. The core workflow needs neither provider credits nor an external API. The scaffold's generic integration/debug surfaces remain, but no integration is part of release decisions.
- Evidence edits have no version history beyond activity messages; a final decision captures the exact latest evidence. No membership removal, release deletion, retention management, or partial-creation repair UI.
- New releases may duplicate if creation is retried after an ambiguous network failure; review the list first. Evidence is last-writer-wins before the final decision. Serialization trades throughput for a small, understandable correctness boundary in a single scope.
- Codex generated the app-specific schemas, rules, actions, UI, tests, and documentation; inspected SDK implementation/types; ran the recorded tests; reviewed desktop/mobile screenshots. The developer supplied the scope, required independent review, authenticated the CLI, and selected the public GitHub repository. No claim is made that the developer personally ran the automated checks.
