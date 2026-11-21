# LaunchProof: Codex Build Contract

## Accepted refinement — November 21, 2026

The user's follow-up evaluation supersedes the original self-approval policy: approval requires at least one verified gate attested by an active reviewer other than the release lead. Enforce this on the server and show the missing condition in the UI. Store the independent reviewer identity in the final snapshot. Product positioning: a collaborative release sign-off workspace preserving human evidence and decision context; no claim of independent CI certification, tamper-proof auditing, or deployment execution. Keep the four-collection architecture.

**Status:** Implementation specification, not a claim that the application exists or has passed tests.

**Deadline:** Sunday, November 22, 2026 at 11:59 PM US Eastern, which is 10:59 PM US Central.

**Goal:** Build and deploy a small, genuinely multiplayer release-readiness app using DeepSpace. Finish the working core before adding optional integrations.

**One-line product:** LaunchProof is a collaborative software-release verification workspace. Reviewers attach evidence to five predefined release gates. Only the authorized lead can approve after every required gate is verified. The decision saves a historical snapshot.

## 0. Nonnegotiable operating rules for Codex

1. Work in the actual local repository. Inspect existing files before changing anything. Do not claim completed work without executing the check.
2. Read `.agents/skills/deepspace/SKILL.md` from the scaffold and the current documentation at https://docs.deep.space/llms.txt before implementing SDK code. Follow actual installed package types and generated scaffold, not assumed APIs.
3. Make the smallest correct change. Reuse the existing scaffold, auth, providers, routing, styling, toasts, tests, and deploy scripts.
4. No new backend framework, database, ORM, socket server, OAuth implementation, state-management library, or UI kit unless the scaffold actually requires one.
5. Four application collections only: `releases`, `team_members`, `gates`, and `events`. Keep the scaffold's `users` and `settings` collections unchanged unless an actual issue requires a change.
6. Single application RecordRoom scope, not one Durable Object per release. Reuse DeepSpace team permissions with memberships in the same scope. Verify the exact behavior in the installed SDK.
7. All sensitive writes go through small named server actions and are denied by default at the collection layer. Do not trust role, user ID, timestamp, approval state, or release ID supplied by the browser without verifying it.
8. Prefer deterministic readiness rules over AI. AI must not mark checks verified, approve releases, or fabricate evidence.
9. Use stable, understandable TypeScript with strict typing. No giant service abstraction, repositories, generic plugin architecture, microservices, magic code generation, or needless files.
10. Only optional integration calls may be mocked in tests. Do not mock internal SDK records, membership, server actions, or two-user synchronization tests.
11. Commit small milestones, keep GitHub as the authoritative repository for the task submission, and verify source selection before the first DeepSpace deploy.
12. Update `BUILD_STATE.md` with: working, tested, failed, not built, exact next step. Never call something verified unless the test actually passed.
13. Avoid broad rewrites. If a feature repeatedly fails, preserve a working earlier commit, cut the feature, and document the tradeoff.
14. Never log passwords, session tokens, email credentials, or personally sensitive release evidence. Use only fictional demo data.

## 1. Definition of done

A fresh reviewer can:

1. Open a working public landing page and sign in using DeepSpace authentication.
2. Create a release with a product name/version and exactly five predefined required gates.
3. Open the same release as another invited, authenticated app user, with live synchronized state.
4. Submit a verification note, optional safe external evidence URL, and mark a gate verified or failed. The system identifies the verified caller and persists the change.
5. See readiness accurately recalculated from server-stored gates.
6. Attempt an incomplete or unauthorized approval and receive a server-side refusal, even when bypassing the browser UI.
7. Approve as the release lead only when every gate is verified, with immutable-at-the-application-level decision data and an evidence snapshot.
8. Refresh or reconnect and see the same verified release and report.
9. Read an accurate README covering implemented integrations, tradeoffs, agent work, direct verification, and known limitations.
10. Open the deployed `*.app.space` address and complete the important path. The URL and pushed GitHub repository both work.

If adding AI or email would endanger items 1 to 10, omit them and explicitly justify that choice. Three integrations are a helpful bar, not a minimum requirement.

## 2. Product boundaries

### Build now

- Public, fast landing screen with one direct Open App button.
- Signed-in release list and Create Release action.
- A single Release Workspace view.
- Five fixed gates: Build/tests; Authentication; Critical issues; Regression smoke; Recovery plan.
- Each gate has `pending`, `verified`, or `failed`, with verification note, optional URL, verified-by ID, and verified-at timestamp. Never claim the underlying CI or external link has been independently validated.
- Lead and reviewer memberships, with add-existing-user control after the other user has signed in once.
- Server-side role-based approval action; final decision snapshot and timeline.
- Loading, empty, error, disconnected and permission-denied UI states.
- Two-user, authorization, and completed-flow tests.

### Add only after the core works

- One DeepSpace AI text integration for a concise report from recorded evidence. User-triggered only, capped, and optional; no AI output affects readiness.
- One DeepSpace email integration for explicit user-approved report delivery. Never auto-email on every update.
- Optional viewer-presence indicator only if trivial with scaffold hooks.

### Do not build

- GitHub OAuth or CI fetching unless it is demonstrably straightforward and directly useful.
- CI execution, deployments, rollback automation, vulnerability scans, file uploads, custom invitation emails, calendars, payments, subprojects, Kanban, chat, document editor, agent swarms, cron, notifications, separate marketing site, complex analytics, multi-policy configuration, enterprise organization controls.

## 3. User and security model

### Roles

- **Lead:** authenticated user who created a release. May add an existing user as reviewer, submit verification, reject the release, or approve when every gate is verified.
- **Reviewer:** an authenticated invited user. May read the release, add or change a gate's evidence/verification while the release is open, and view the final report. Cannot approve or alter membership.
- **Outsider:** authenticated but not a member of this release. Cannot read records or call release-specific operations successfully.
- **Signed-out visitor:** only sees the static landing and sign-in, not private data.

These are local roles stored in `team_members.roleInRelease`; they are NOT DeepSpace global admin/member roles. A global app admin may have broader SDK access, but still must use server actions for normal application state transitions.

### Trust boundaries

- Use `ctx.userId` from the verified session in every action, never a `userId` from `params` for the actor.
- For each action: `tools.get('releases', releaseId)`, verify existence and state, query `team_members` by releaseId and `ctx.userId`, require `status === 'active'`, and enforce `roleInRelease` as appropriate.
- For evidence edits, fetch gate by ID and verify its `releaseId` matches the authorized release, so a gate ID from a different release cannot be mutated.
- In collection RBAC, signed-out and ordinary uninvited callers should read nothing. Use `team` read rules where supported and put membership rows in the same RecordRoom scope as release/gate/event records.
- Do not expose direct client mutation rights for protected releases, gates, membership or events. Server actions write after explicit checks. This is simplest to reason about, even though it adds a few short actions.
- Never permit the client to choose final approver, `verifiedBy`, `approvedAt`, membership role, final snapshot, or audit-event actor fields.
- Never permit evidence changes after a final decision. This is enforced by actions, not merely a disabled button.
- Validate strings and URL schemes. Display user text using React text rendering, never `dangerouslySetInnerHTML`. Open HTTP(S) links with `rel="noopener noreferrer"`.
- Prefer generic not-found/forbidden messages to avoid leaking whether another user's release exists.
- Provide safe error messages to the UI; keep sensitive technical traces in controlled logs only.

## 4. Minimal data model

Use **lowercase field names consistently** and verify schema types and team-field behavior with actual installed DeepSpace schema types. The following is the intended logical contract, not pasted SDK code.

### `releases`

- `name: string` (required, length 2 to 80)
- `version: string` (required, length 1 to 30)
- `status: 'initializing' | 'draft' | 'approved' | 'rejected' | 'init_failed'`
- `leadUserId: string` (set from verified actor, never browser)
- `policyVersion: 'v1'`
- `decisionSnapshot?: JSON` (final gates and evidence, decision, actor and time)
- `decisionAt?: number` (epoch milliseconds)
- `decisionBy?: string`
- `decisionReason?: string`
- The release record ID is the `teamId` used for permissions. For the release collection, confirm `teamField: '_rowId'` works with the installed SDK, as used in DeepSpace Taskspace.
- `member` read='team'; all direct create/update/delete disabled. `admin` direct writes also disabled for these protected records when the SDK accepts it. Only actions write.

### `team_members`

- `teamId: string` (release ID)
- `userId: string`
- `status: 'active'`
- `roleInRelease: 'lead' | 'reviewer'`
- `addedAt: number`
- `teamField: 'teamId'`
- `uniqueOn: ['teamId','userId']` if supported.
- Read membership only within relevant team; no client create/update/delete. Use small server actions.
- Check exact field-name conventions, as SDK docs and some examples vary in casing. Consistency with the installed package is authoritative.

### `gates`

- `releaseId: string` (team ID)
- `key: 'build' | 'auth' | 'critical' | 'smoke' | 'recovery'`
- `title: string`
- `required: boolean` (always true for v1)
- `status: 'pending' | 'verified' | 'failed'`
- `evidenceNote: string` (empty until submitted, 10 to 1000 chars when verified)
- `evidenceUrl: string` (optional, HTTP(S) only, maximum 500 chars)
- `verifiedBy: string` (server stamped)
- `verifiedAt: number` (server stamped)
- `teamField: 'releaseId'`
- `uniqueOn: ['releaseId', 'key']` if supported.
- `member` read='team'; direct create/update/delete disabled; actions only.

### `events`

- `releaseId: string`
- `actorUserId: string`
- `kind: 'release_created' | 'reviewer_added' | 'gate_updated' | 'release_approved' | 'release_rejected'`
- `summary: string`
- `occurredAt: number`
- `details: JSON` (limited and non-sensitive)
- `teamField: 'releaseId'`
- `member` read='team'; all direct writes disabled; action-created only.
- Treat events as append-only. The approval snapshot stored in `releases` is the primary record for final decision.

### Five gates

```
const REQUIRED_GATES = [
  { key: 'build', title: 'Build and automated tests' },
  { key: 'auth', title: 'Authentication and authorization' },
  { key: 'critical', title: 'Critical issues resolved' },
  { key: 'smoke', title: 'Regression smoke test' },
  { key: 'recovery', title: 'Recovery readiness' },
] as const;
```

Put these in exactly one `src/lib/release-rules.ts` file. Do not repeat them in worker, UI and tests as independently maintained constants.

## 5. Domain rules

Define pure, unit-tested functions:

- `validateReleaseInput(name, version)`
- `validateEvidence(status, note, url)`
- `getReleaseReadiness(gates)`
- `makeDecisionSnapshot(release, gates, actorId, decision, reason, now)`

Readiness is computed, not client-authored. A release is approvable only if:

1. Status is exactly `draft`.
2. There are exactly five distinct gate keys matching the v1 policy, each linked to this release.
3. All five gate statuses are `verified`.
4. Each has a nonempty qualifying evidence note and server-stamped verifier information.
5. The acting user is an active lead.

Use a clear public-ready function like:

```
function getReadiness(gates: Gate[]) {
  const expected = new Set(REQUIRED_GATES.map(x => x.key));
  const keys = gates.map(g => g.key);
  const completeSet = gates.length === expected.size &&
    new Set(keys).size === expected.size &&
    keys.every(key => expected.has(key));
  const verified = completeSet && gates.every(g =>
    g.status === 'verified' &&
    g.evidenceNote.trim().length >= 10 &&
    Boolean(g.verifiedBy && g.verifiedAt)
  );
  return { approvable: verified, completeSet,
    missing: gates.filter(g => g.status !== 'verified').map(g => g.key) };
}
```

This snippet is illustrative domain code. Codex should make it type-safe and ensure every expected key is present, not merely every existing key is valid.

Evidence is a **recorded human attestation**, not independently verified CI evidence. UI copy and README must say so.

A decision snapshot should include the exact five gates with their evidence fields, policyVersion, action, actorId, decidedAt, and reason. The report renders from this saved snapshot, not mutable live gates.

## 6. Named server actions, minimal set

Use the scaffold's existing `src/actions/index.ts` and the SDK's `ActionHandler` / `tools` methods. Confirm registration is already wired in `worker.ts` before changing it. Endpoint pattern documented by DeepSpace: `POST /api/actions/<actionName>` with a verified bearer token.

### `createRelease`

Input: `{ name, version }`.

- Validate input.
- Create release with status `initializing` and actor-derived lead ID.
- Create lead membership in `team_members` with role `lead`.
- Create exactly five required gates with status `pending`.
- Mark release `draft` only after all gates were confirmed created.
- Create a `release_created` event as secondary telemetry.
- Return `{ releaseId }` on success. If partial failure occurs, return error and leave the release non-approvable (`init_failed` or `initializing`). Prefer a small deterministic repair/test strategy, not hidden partial success.
- Do not make users sign up for any new external service.

### `addReviewer`

Input: `{ releaseId, targetUserId }`.

- Validate lead membership and `draft` state.
- Validate that target user is an existing authenticated app user, not a client-invented user ID. Use the scaffold user roster or server lookup, respecting privacy.
- Reject adding self as reviewer, unknown target, duplicate membership.
- Create a `team_members` record with role `reviewer` and status `active`.
- Return success only when membership creation is acknowledged.
- Event is secondary; don't report success falsely if essential creation failed.
- No public invite token or outbound email; users must have signed in at least once.

### `verifyGate`

Input: `{ releaseId, gateId, status, evidenceNote, evidenceUrl? }`.

- Validate active membership (lead or reviewer) and release `draft` state.
- Validate status (`verified` or `failed`), evidence note length, URL scheme and length. A reviewer may also revert to `pending` with a clear note if policy permits; if added, test it. Simpler v1 can allow `verified` or `failed` only and provide a reset action for leads.
- Fetch gate and verify `gate.releaseId === releaseId`.
- Update only the gate fields, with `verifiedBy=ctx.userId` and `verifiedAt=Date.now()`; do not replace the entire record object.
- Create a best-effort `gate_updated` event. Critical state is gate update; failed event should be surfaced as a warning, not silently misrepresented as an entirely failed verification.
- UI should wait for the action's confirmed result before showing success.

### `decideRelease`

Input: `{ releaseId, decision: 'approved' | 'rejected', reason }`.

- Require active release lead. A reviewer and outsider get a refused response.
- Require release status `draft`.
- Fetch the release's current gate records on the server.
- Require the five-gate policy; for approval, every gate must meet evidence requirements.
- For rejection, require a short reason; incomplete gates are allowed, because a lead may reject early.
- Create the decision snapshot from server-observed records and verified actor/time.
- Save release final status plus snapshot. Block future evidence updates using the server actions.
- Use an idempotent or deterministic event ID where possible to reduce duplicate final audit events.
- Repeated calls must not create a second approved decision.
- Return the persisted decision details.

**Concurrency limitation to explicitly de-risk:** Multi-step `tools.get`/`tools.query`/`tools.update` calls are not automatically proven atomic just because individual DeepSpace writes are serialized. Verify whether the installed SDK has a documented transaction or compare-and-set mechanism suitable for the approval transition. If it does, implement it. If not, test simultaneous `verifyGate`/`decideRelease` and simultaneous approvals; do not claim transactional or linearizable behavior you cannot prove. The safe fallback for this hiring exercise is to freeze and validate all mutations on the server, record a primary decision snapshot, refuse repeated decisions, and document any remaining concurrency limitations. Never hide a failed concurrent-state test.

### Optional `generateReview`

Only when core is done. Require active member and an existing release. Use one text-model integration called from an authenticated server action. Supply a sanitized structured snapshot of gate statuses/evidence and request a compact summary. Never allow the result to change verification or approval. Limit requests, output length, cost, and timeout. On failure show an error and preserve the manual report. Do not send confidential user data to a provider in a real deployment; use fictional demo data for this evaluation.

### Optional `sendReport`

Require final release and release lead, explicit recipient confirmation, validated email, fixed recipient limits, and rate limits. Use DeepSpace's email integration if supported; only claim sending after a successful provider response. Report remains viewable without email.

## 7. UI and UX plan

Keep the app to three meaningful authenticated screens, plus a static landing. Use existing scaffold components, Tailwind and lucide icons if available; do not install a new component library solely for this.

### Landing `/`

- Static, no auth hooks or WebSocket, following scaffold routing contract.
- Logo, tagline, two-sentence explanation, one `Open workspace` button, simplified visual preview of release gates.
- No giant marketing site, carousel, stock illustration or long animations.

### Release list `/home` (inside existing gated layout or a new file inside the existing protected group)

- Heading, `New release` action.
- Rows/cards: project name, version, status, verified-gate count, last activity.
- Empty state with a direct create CTA.
- Creation modal: name/version only.
- Helpful seed/example release optional, but no fake demo that bypasses real records.

### Release workspace `/releases/:id` (under the existing protected layout)

- Top: product name, version, status, lead, reviewer avatars/names, active members if presence is easy.
- Main left: five gate cards with status, evidence note, URL, author and timestamp; evidence edit modal or inline form.
- Side panel: deterministic Readiness explanation and recent events.
- Footer or fixed panel: Approve/Reject actions visible only when appropriate, with explanatory disabled states.
- Clear `loading`, `not connected`, `not found / no access`, `action failed`, and `read-only final decision` states.
- Mobile: single column, readable status, buttons >= 44px tall, no horizontal overflow.

### Final report `/releases/:id/report`

- Decision status, lead, decidedAt, reason, five captured gate snapshots and sources.
- Copy/share text using a normal browser copy interaction if convenient.
- Optional AI narrative and send button, clearly secondary to verified facts.
- Report must still work after refreshing the page or losing the AI service.

Use simple nav: `Releases`, `New release`, `Account` (built-in). A three-panel dashboard is not required.

## 8. File boundaries and minimum code

Do not create this structure blindly. Use the scaffold's existing generated files and add only what is needed.

```
launchproof/
  AGENTS.md                        # brief, must be read by Codex
  BUILD_STATE.md                   # actual progress and next action
  README.md
  worker.ts                        # use existing SDK wiring
  src/
    schemas.ts                     # register four additional schemas
    schemas/
      releases-schema.ts
      team-members-schema.ts
      gates-schema.ts
      events-schema.ts
    lib/
      release-rules.ts             # one source of gate definitions and pure rules
      action-client.ts             # tiny authenticated POST helper, only if needed
    actions/
      index.ts                     # four named actions; no generic actions framework
    components/
      GateCard.tsx
      EvidenceForm.tsx
      ReadinessPanel.tsx
      EventTimeline.tsx
    pages/
      index.tsx                    # scaffold static landing
      (app)/
        (protected)/
          releases.tsx             # or existing home route
          releases/[id].tsx        # confirm generouted dynamic route path
          releases/[id]/report.tsx # confirm route nesting
  tests/
    smoke.spec.ts
    api.spec.ts
    collab.spec.ts
    release-rules.test.ts          # unit tests if scaffold supports placement
```

If the scaffold's actual route layout differs, follow the scaffold, not these illustrative paths. Do not add a custom router or generic repository layer. A small amount of repeated UI code is better than a premature abstraction.

Target: clear, maintainable files, not an artificial line-count cap. Avoid monolithic 1000-line components and avoid fragmentation into dozens of tiny files.

## 9. Exact construction sequence and quality gates

### Phase 0: Orientation (highest priority)

- Read `AGENTS.md` and `.agents/skills/deepspace/SKILL.md`.
- Read current docs index, quickstart, project structure, permissions, server actions, testing, and source control.
- Run `node --version` and `npm --version`; follow the docs' supported Node/npm requirements.
- Check `npx deepspace auth whoami --json`; log in interactively only if needed. Never ask for account password in code.
- Check existing Git remotes and `npx deepspace status --json`; choose GitHub source before first deployment. Do not call `deepspace push` on an unclaimed GitHub-intended app.
- Scaffold only if the project does not exist.
- Check `npx deepspace add --list`, `npx deepspace integrations list`, and endpoint info before integration work.
- Make a first commit.

**Gate:** Dev server renders scaffold; no auth/config errors; repository and intended source provider known.

### Phase 1: Domain and persistence

- Implement four schemas and pure rules.
- Add createRelease and initial five gates.
- Render release list and workspace from real `useQuery` subscriptions.
- Ensure creation persists after refresh and does not navigate prematurely.
- Add unit tests for readiness rules and user input validation.
- Deploy an initial working baseline only after GitHub source is correctly set.

**Gate:** Authenticated user creates and reopens a real release with exactly five pending gates.

### Phase 2: Secure collaboration

- Implement addReviewer for an existing signed-in user.
- Confirm user directory/membership uses current SDK contract.
- Implement verifyGate with actor-stamped evidence and strict release/gate matching.
- Use `useQuery` for live updates, not manual polling or custom WebSocket code.
- Verify outsider cannot read or update release records.
- Test two signed-in contexts using `users(2)` from `deepspace/testing`.

**Gate:** A and B see shared updates without refresh; C cannot read private data or write.

### Phase 3: Decisions and history

- Implement decideRelease and decision snapshot.
- Add events timeline and readonly report.
- Validate server-side refusal on incomplete or unauthorized approval.
- Test repeat submissions, different-release gate IDs, post-approval edits, and concurrent requests.
- Document any unverified transaction assumption.

**Gate:** Lead completes all five gates, approves, reloads, and sees immutable historical snapshot; restricted callers fail.

### Phase 4: Polish and optional integration

- Add clear empty/loading/error/permission-denied states.
- Fix mobile width and keyboard focus.
- If core is fully verified: add one AI summary integration with a bounded request budget. If time remains, add email.
- Never make the main flow depend on an optional API provider.

**Gate:** Core works with AI/email disabled, even when the integration is unavailable.

### Phase 5: Production and submission

- Run typecheck, lint, unit, smoke, API and collab tests using scaffold commands.
- Commit and push GitHub code. Deploy clean local working tree; verify actual source revision.
- Open real deployed URL in a clean browser. Sign in, create, verify, invite/second user, approve, refresh, see report.
- Inspect runtime logs for denied actions, errors and blank-page issues.
- Write README and portal submission, stating actual verified behavior only.
- Record the deployed URL, repository URL, checked date/time, and test results.

**Gate:** A complete hands-on production smoke test passed. Otherwise describe exactly what is still broken and provide the best working version rather than pretending success.

## 10. Failure-mode matrix and fix/playbook

| ID | Failure | Detection | Correct response | Severity |
|---|---|---|---|---|
| F01 | CLI signed into wrong account | `auth whoami` mismatch | Stop before app registration; authenticate intended owner | Blocker |
| F02 | npm/Node mismatch | Scaffold/install errors | Check installed versions and SDK installation guidance; upgrade supported tooling | Blocker |
| F03 | Wrong Git source permanently claimed | `app source` says DeepSpace instead of GitHub | Stop assuming remote changes can repair it; create a new app only if needed, with correct first deploy | Blocker |
| F04 | Scaffold providers broken | `useQuery` throws, blank screen | Keep protected pages under existing `(app)/(protected)/` layout and preserve providers | Blocker |
| F05 | Schema lint warnings | Worker prints `[schema-lint]` | Fix teamField, ownerField/userBound or visibility definitions before proceeding | High |
| F06 | New release partially created | Missing one or more required gate rows | Never mark draft; surface init failure; inspect failed action, repair with a tested path or recreate | High |
| F07 | Reviewer not allowed to see data | Second context empty after invite | Check `team_members` same-scope membership, case of fields, active status, `teamField` definitions and connection refresh | High |
| F08 | Uninvited user sees private release | Third-context query returns data | Block submission. Correct collection read RBAC and retest with real user | Critical |
| F09 | Unauthorized action succeeds | Reviewer POST to approve returns success | Block submission. Authorize actor in each privileged action; test direct API calls | Critical |
| F10 | Gate ID from other release accepted | Mutation updates cross-release gate | Require `gate.releaseId === authorized releaseId` before writing | Critical |
| F11 | Browser says saved before server accepts | Refresh loses evidence | Use confirmed result or await server action before navigating; handle error envelope | High |
| F12 | Loading mistaken for no data | False empty state | Use `useQuery.status` and show loading/error/ready separately | Medium |
| F13 | User edits approved gate | Final evidence changes after approval | Reject writes if release status is not draft; inspect direct RBAC paths | Critical |
| F14 | Duplicate approval on retry | Multiple decision events | Check status before action, use idempotent event IDs if possible; test repeat requests | High |
| F15 | Concurrent approval vs verification | Inconsistent decision snapshot | Investigate SDK transaction/CAS semantics; write adversarial test; do not claim atomicity without proof; fail closed or document limitation | High |
| F16 | Audit event fails after main update | Decision saved but timeline missing row | Treat snapshot as source of truth; surface warning and repair if safe; do not overwrite decision | Medium |
| F17 | Invalid evidence URL | `javascript:` or `file:` link | Accept only HTTP(S); render plain escaped text; add test | High |
| F18 | Huge form strings | Broken UI or bloated records | Enforce server-side length limits; trim; give clear validation error | Medium |
| F19 | AI request costs credits unexpectedly | Unexpected quota or charges | Make action auth-protected, user-triggered, rate-limited; cap output and number of invocations | High |
| F20 | AI fabricates a test result | Summary claims verified checks absent from snapshot | Ground prompt in saved data; never permit AI result to alter gates; label narrative advisory | High |
| F21 | Email failure / duplicate send | Provider error or repeated clicks | Explicit Send action with disabled pending state, validated recipient, retry only on failure, prevent duplicate clicks | Medium |
| F22 | Sign-in works locally but not in production | Blank / auth loop | Compare deployed environment, browser console, SDK auth/provider setup, logs | Blocker |
| F23 | Real-time reconnect drops expected state | Stale second browser | Exercise reconnect, query ready status and refresh subscriptions, not homegrown polling | Medium |
| F24 | Test suite doesn't actually test 2 users | Single-context fake tests | Use DeepSpace fixture `users(2)` and separate authenticated contexts | High |
| F25 | Test accounts missing | Fixture account selector not found | `npx deepspace test accounts list --usable`; create only missing account(s) per docs, never commit credentials | Medium |
| F26 | Deployed code differs from GitHub | Dirty-worktree deploy | Commit, push, inspect `releases`/`status` before submission; redeploy from intended revision | High |
| F27 | Too little time for optional integrations | Core still failing | Cut AI/email, prioritize auth, live state, server approval, tests, deploy and honest writeup | High |
| F28 | No demo path | Reviewer sees blank list | Create clearly labeled sample data through same real flow; do not publish private test accounts or fake API behavior | Medium |

### Debug discipline

For each failure:

1. Copy the exact error and reproduction steps into `BUILD_STATE.md`.
2. Distinguish whether it is client rendering, auth, schema, RBAC, action, integration, or deploy.
3. Make one falsifiable hypothesis; inspect the relevant docs/source/types.
4. Add or update a test that reproduces the issue.
5. Change only the smallest relevant code path.
6. Re-run that test and the neighboring core test.
7. Record whether the issue is verified fixed, still open, or explicitly deferred.
8. If two fixes fail in the same area and no clear diagnosis exists, stop expanding scope and protect the current functioning release.

## 11. Test plan with realistic claims

### Unit tests (pure rules)

- 0 gates: not ready.
- Only 4 gates: not ready.
- Six gates or duplicate key: not ready.
- Five correct gates, one pending: not ready.
- Five correct gates, one failed: not ready.
- Five verified but missing evidence: not ready.
- Exactly five verified with valid evidence: ready.
- URL validation refuses unsupported schemes.
- Final decision snapshot is stable if source objects later change.

### API/integration tests

- Unauthenticated action receives authorization error.
- Creating release stamps the real caller as lead.
- Reviewer cannot add another reviewer or approve.
- Outsider cannot submit gate evidence using guessed IDs.
- Wrong-release gate ID is refused.
- Approval incomplete is refused.
- Approval succeeds with five verified gates, then repeated approval does not duplicate decision.
- Post-approval gate update refused.
- AI failure, when enabled, does not mutate state.

### Multiplayer tests

Use actual `import { test, expect } from 'deepspace/testing'` and `const [alice, bob] = await users(2)` with app pages, not a fake record store.

- Alice creates release, invites Bob; Bob can open it.
- Bob updates a gate; Alice sees the actual record change without refresh.
- Alice approves after all gates verified; Bob sees final state and can no longer edit.
- Third user cannot read private data, tested via UI and underlying API or record subscription as appropriate.
- Reconnect a browser and verify consistent record state.

### Production smoke test

Use deployed app, not localhost. Open a new browser/private context. Verify signed-out landing, sign-in, creation, five gates, reviewer add, live update, denied action, authorized approval, refresh/report. Save date/time and observations in README.

DeepSpace current commands (verify installed CLI help):

```
npx deepspace test run
npx deepspace test run unit
npx deepspace test run e2e
npx deepspace deploy
npx deepspace app source --json
npx deepspace status --json
npx deepspace logs
npx deepspace releases
```

The default test run may skip collaboration specs, so `e2e` is mandatory before declaring multi-user success.

## 12. Timeline and triage

**Absolute portal deadline:** November 22, 2026, 11:59 PM Eastern = 10:59 PM Central.

Treat the following as an order of execution rather than a promise of task duration:

1. Immediately: repo, SDK checks, schema, first create/open flow.
2. Next: verified gate submission and reliable first-user data persistence.
3. Next: second-user membership and real-time sync, with outsider test.
4. Next: guarded approval, persistent snapshot, locked final state.
5. Next: full tests, production deploy, actual fresh-session smoke.
6. Only if time remains: AI summary, then email. Keep at least the final part of the deadline window for production verification and portal writeup.

**Cut order if behind:** decorative graphics, presence badges, email, AI, event detail rich formatting, optional rejection flow, nonessential forms. Never cut private data security, server approval rule, deployed working core, or honest writeup. If unable to prove concurrency safety, disclose that limitation instead of making an unsupported guarantee.

## 13. Operational source-control rules

- Set up and verify the intended GitHub repo and `origin` before the **first** DeepSpace deploy that claims the app source.
- Before registering an app, verify the CLI account with `auth whoami`.
- `npx deepspace status --json` previews source inference. `npx deepspace app source --json` reports existing claim.
- Do not use `deepspace push` before claiming GitHub source; a first push or a deploy without selected GitHub remote permanently claims DeepSpace source.
- Under GitHub source, `deepspace deploy` deploys the local working tree, even with uncommitted bytes. Commit/push before final release and inspect the revision/dirty flag.
- Do not commit `.dev.vars`, tokens, local test account credentials or personal data.

## 14. README and portal writeup requirements

README:

1. What LaunchProof does, with one screenshot or compact workflow diagram.
2. Live deployed URL.
3. How to create a release, invite a member who has already signed in, verify gates and approve.
4. Architecture: native DeepSpace primitives and exactly which external integrations were actually used.
5. Data model and RBAC: app roles vs release membership.
6. Key tradeoff: fixed five-gate policy, human-attested evidence, no automatic CI validation.
7. How to run tests and reproducible test results.
8. What AI agent generated and what the developer personally reviewed/verified.
9. Known limitations, especially any concurrency guarantee that was not proven.
10. Local dev instructions, dependency versions, secure configuration notes.

Portal note (short, after completion, only facts that have been verified):

```
Built LaunchProof, a collaborative release-verification app on DeepSpace.
Reviewers submit evidence for five required gates. A release lead can approve
only after server-side readiness and authorization checks pass. Each decision
stores a historical evidence snapshot.

DeepSpace capabilities used: [actual verified primitives].
External integrations used: [only those implemented and tested].
Main tradeoff: one fixed verification policy and human-attested evidence rather
than building full CI/CD automation, to finish and test one reliable workflow.
Coding agent work: [actual files / code / tests produced].
I personally verified: [actual checks run, with results].
Known limitations: [any remaining issues].
```

## 15. Exact first instructions to Codex

**Paste this into Codex with the repository open:**

> Implement LaunchProof according to `LAUNCHPROOF_CODEX_BUILD_SPEC.md`. Before coding, inspect the current repository and read the bundled DeepSpace skill at `.agents/skills/deepspace/SKILL.md` and the latest documentation index at `https://docs.deep.space/llms.txt`. First report the current scaffold state, Node/npm/SDK versions, Git source state, and the smallest viable implementation sequence. Then execute Phase 0 and Phase 1, including real tests. Do not implement optional AI, email, chat, payments, CI integration or elaborate styling until release creation and persistence work. Do not invent SDK types or claim atomically enforced approvals without testing. Update `BUILD_STATE.md` with verified results and exact next steps. Continue through the phases in order, preserving a working commit after each phase. Ask only for required login or irreversible repository/source-control decisions.

**At every handoff, have Codex report:**

- Changed files and a one-sentence reason for each.
- Commands executed and results, including failing tests.
- What demonstrably works in local and deployed environments.
- What is missing or unverified.
- The single next implementation or verification step.

## 16. Authoritative references

- DeepSpace docs index: https://docs.deep.space/llms.txt
- SDK quickstart: https://docs.deep.space/get-started/quickstart
- Project structure: https://docs.deep.space/get-started/project-structure
- Record data: https://docs.deep.space/guides/data-storage
- Permissions: https://docs.deep.space/concepts/permissions
- Server actions: https://docs.deep.space/guides/server-actions
- Client records API: https://docs.deep.space/sdk-reference/client/records
- Testing: https://docs.deep.space/guides/testing
- Source control: https://docs.deep.space/guides/source-control
- External APIs: https://docs.deep.space/guides/external-apis
- Official example that should NOT be copied as generic checklist: https://github.com/deepdotspace/taskspace
- Official background-job example: https://github.com/deepdotspace/threadhunt
- Installed agent skill: `.agents/skills/deepspace/SKILL.md`, after scaffolding.

## 17. Decision log

- Product locked: LaunchProof, evidence-based collaborative release verification.
- Single-scope design to reduce custom Durable Object wiring.
- Four application collections, not six or more.
- Five fixed gates, no policy builder.
- Authenticated pre-existing app users instead of email invitation onboarding.
- Server actions handle privileged state changes; SDK RBAC handles read isolation.
- Human verification is attestation, not proof of CI execution.
- Saved decision snapshot is authoritative; events are auxiliary history.
- Default policy is closed: unknown actor, missing membership, invalid gate, incomplete data, missing SDK capabilities or uncertain approval state should not result in an approved release.
- Optional AI/email never block core functionality.

**End of specification.**
