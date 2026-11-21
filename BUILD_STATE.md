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

## Initial deployment result
- Public GitHub main pushed at 315929c. First deploy refused route_taken: launchproof.app.space belongs to another app.
- app list confirms only this new, undeployed app belongs to the signed-in account. app source confirms permanent github/sabin901/launchproof claim revision 1.
- Requested URL was conditional on availability. Selected launchproof-sabin901.app.space; kept immutable app ID and GitHub source unchanged.

## Phase 5 verified — November 21, 2026, approximately 3:43 PM Central
- Live: https://launchproof-sabin901.app.space
- Public repository: https://github.com/sabin901/LaunchProof
- Release rel_01M800ZJ5PWDW2QX798KS40J5T deployed from clean pushed commit 21333126f97ea2945092cd02506e94d31c76e728. GitHub main and local HEAD matched. DeepSpace ledger reports GitHub source revision 1, sourceDirty:false, serving:true (its GitHub ledger does not expose a Git commitOid).
- Production command: LAUNCHPROOF_BASE_URL=https://launchproof-sabin901.app.space npx playwright test --config tests/playwright.config.ts — 19 passed in 25.9s. Separate fresh browser contexts and real production auth/records; no app-record/action mocks. Only scaffold external integration status tests mock the integration boundary.
- Verified full browser create → five evidence submissions → lead-only approval disabled → invite reviewer → independent attestation → lead approval → saved report, plus refresh, outsider direct record reads, direct-write refusal, unauthorized/incomplete approval, cross-release edits, simultaneous approvals and approval/edit race, rejected report, reconnect, mobile layout.
- npx deepspace logs --level error --since 15m --limit 30 --json returned count:0 after deployment/testing.
- Runtime limitations remain as documented in README (human evidence, no crash rollback/cryptographic audit, no automatic repair, retained fictional test records, fixed policy). No optional AI/email.
- README and SUBMISSION now contain actual live URL and test outcomes. Final docs-only revision will be committed/pushed/redeployed to keep checkout, source and deployment aligned.
- No required implementation task remains after final source/deploy consistency check. Developer may review the live app and use SUBMISSION.md for the portal; no portal submission was performed.

## Requested frontend redesign — November 21, 2026
- User chose a light dashboard with blue accents. Reworked landing, release overview, workspace, navigation, report, shared tokens, and responsive styles.
- Added live release counts, search by name/version, status filters, Needs attention gate view, copy reviewer ID/workspace link/report summary, JSON snapshot download, and print styles. No new collections, services, integrations, or runtime dependencies.
- Simplified repeated request handling into useAction; reduced navigation state/duplicate link rendering and removed unused nav.ts. Formatted app-specific actions/rules/components for readability. Formatting increases physical line counts while removing dense one-line code; no false claim of a smaller total feature codebase.
- Confirmed typecheck, lint, 10 unit tests and 20 real local browser tests. Expanded tests verify search/status filtering, clipboard contents, attention filtering, downloaded snapshot fields, print-control visibility, desktop/mobile no-overflow, plus all original security/concurrency tests.
- Visually reviewed new landing/dashboard/workspace and mobile dashboard screenshots. Updated docs screenshots.
- Next: production build, clean commit/push/deploy, production regression suite.

## Palette correction from user
- User said blue resembled other projects. Replaced it before deployment with warm ivory (#f6f2eb), charcoal (#302b26), and burnt orange (#ad4526), including borders, focus, navigation, buttons and illustrations. Green/red remain semantic status indicators.
- End-to-end UI flow rerun after palette change: PASS. Screenshots visually inspected.
- Dashboard filtering/clipboard/mobile test rerun to capture updated warm screenshots.
