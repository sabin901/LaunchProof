# LaunchProof build state

## Verified environment — November 21, 2026
- New checkout: C:/Users/sabin/OneDrive/Desktop/launchproof. No existing project found in the scanned workspace locations.
- Node 24.14.1, npm 11.13.0, Git 2.54.0, GitHub CLI 2.97.0.
- Scaffold and installed SDK: 0.44.2. npm install passed (547 packages).
- GitHub CLI account: sabin901. DeepSpace production login verified after browser OAuth.
- Read full supplied contract, scaffold AGENTS.md, docs index, installation, project structure, permissions, actions, testing, source control, installed ActionTools types.
- Current scaffold does not bundle the skill. Retrieved official skills/deepspace/SKILL.md from deepdotspace/deepspace-skill (HEAD dadfa915c6fe84ce19c54f207161f3ef8b68958a).

## In progress
- Phase 1: four schemas, pure validation/readiness rules, createRelease, subscribed release screens.
- No persistence, collaboration, security, concurrency, or production checks passed yet.
- App source remains unclaimed; no deploy or deepspace push has run.

## Observed failures / changes from plan
- Noninteractive auth login refused interactive_required; reran in a PTY and user completed browser login.
- SDK ActionTools exposes no transaction or CAS operation. Multi-operation actions must not be described as atomic.
- Initial guessed official skill root URL returned 404; found actual path through repository tree and read it.

## Next
Finish Phase 1 UI and pure tests, start authenticated dev server, verify creation and refresh against real records before Phase 2.

## Phase 1 verified
- Changed: src/lib/release-rules.ts and tests (fixed policy/input/readiness/snapshot rules); src/schemas/release-schemas.ts and schemas.ts (four collections); actions/index.ts (confirmed creation); action-client.ts (authenticated POST); protected home/workspace and static landing; launchproof.css, navigation, display name, HTML theme; tests/persistence.spec.ts.
- Commands: npm run type-check PASS; npm run test:unit PASS (8 tests / 3 files); deepspace test run tests/persistence.spec.ts initially refused port_in_use, rerun --port 5181 PASS (1 browser test).
- Real authenticated create, five pending gates, refresh and persistence passed.
- Registration produced app_01M80009Z3FM4K2GTPMS4KXA08. Three test accounts created through CLI; credentials kept only in SDK credential store.
- Source unclaimed; no deployment. Membership isolation, evidence, approval and concurrency remain unverified.
- Next: Phase 2 actions and actual three-user isolation/live update tests.

## Phase 2 verified
- Added addReviewer/verifyGate authorization, membership/actor checks, safe evidence validation, GateCard editor, reviewer form and activity subscriptions.
- npm run type-check PASS. deepspace test run tests/release-collab.spec.ts --port 5181 PASS (one real three-user test).
- Verified live reviewer evidence visible to lead without refresh; outsider workspace withheld and forged action refused; reviewer cannot invite; refresh after offline/online preserves evidence.
- Next: final decision/report, direct-RBAC checks and concurrency tests. Investigate same-RecordRoom serialization via Cloudflare blockConcurrencyWhile (documented at developers.cloudflare.com/durable-objects/api/state/), no new DO or data store.

## Phase 3 verification and accepted scope refinement
- Decision action, saved report, final-state write locks, and same-RecordRoom workflow serialization implemented. Authenticated edge forwards only verified identity; the existing DO executes bounded SDK record calls under blockConcurrencyWhile, avoiding reentrant RPC or integration calls. This is serialization, not crash rollback or cryptographic immutability.
- Failures found/fixed: SDK booleans arrive as SQLite 0/1 (strict true caused all approvals to fail); report nested beneath a non-Outlet route (moved workspace to [id]/index.tsx); direct-tool failures use ok:false/code:tool_failed (updated assertions to match actual denial envelope).
- Decision/race/report test passed. Full pre-refinement suite passed 19 tests. Typecheck/lint/build passed; pure suite now 10 tests.
- User supplied critical evaluation: implemented mandatory active independent reviewer attestation before approval, captured reviewer IDs, and clarified product/evidence wording. Contract amended explicitly. Updated tests enforce self-approval denial.
- User explicitly selected public GitHub repository and supplied https://github.com/sabin901/LaunchProof.git. Existing repo was empty/public; connected origin without overwriting history. DeepSpace status now infers github.
- Next: complete updated full-suite and visual checks, commit/push, deploy with verified GitHub source, test production with fresh authenticated contexts.

## Phases 3–4 complete locally
- Updated policy suite: 19/19 Playwright tests passed; 10/10 unit tests passed; typecheck/lint/build passed.
- Visual QA: inspected desktop landing/workspace and 390px report. Fixed route scroll restoration; reran full UI workflow PASS after fix. Mobile has no horizontal overflow.
- Independent reviewer is mandatory on server and in UI; active reviewer IDs are captured in snapshot. Lead-only five-gate self-approval is tested/refused.
- Added README and submission draft with limitations and precise attribution. Optional AI/email omitted.
- Next: push public GitHub main and deploy clean revision; run production tests and inspect logs.
