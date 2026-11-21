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
