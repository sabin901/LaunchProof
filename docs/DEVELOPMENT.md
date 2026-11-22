# Reading LaunchProof

Start with the release workflow, then follow one request from the form to storage.
Most files outside this path are DeepSpace scaffold code for authentication,
routing, or reusable UI components.

## Read these files in order

| File | Responsibility |
| --- | --- |
| `src/lib/release-rules.ts` | Types, the five-gate policy, input validation, approval eligibility, and snapshot construction. Pure functions; no network or database calls. |
| `src/actions/index.ts` | Four named server operations in workflow order: create release, add reviewer, record evidence, decide release. |
| `src/schemas/release-schemas.ts` | Four stored collections and their read/write permissions. |
| `src/server/action-routes.ts` | Verify caller identity, validate the request body, and forward to the existing RecordRoom. |
| `worker.ts` → `AppRecordRoom.fetch` | Run the whole action inside the room's concurrency lock. |
| `src/lib/use-action.ts` and `action-client.ts` | Shared form state and authenticated browser requests. |

The pages under `src/pages/(app)/(protected)` render subscribed records. `home.tsx`
is the dashboard, `releases/[id]/index.tsx` is the workspace, and `report.tsx`
renders the saved decision. `GateCard` and `DecisionPanel` submit the relevant
actions. The public landing page is `src/pages/index.tsx`.

## One evidence update

1. `GateCard` collects the note, URL, and result.
2. `useAction` shows pending/error/success state; `callAction` sends the auth token.
3. The action route verifies identity. A user ID supplied in the body is not trusted.
4. The RecordRoom locks the workflow and invokes `verifyGate`.
5. `requireDraftMember` checks active membership and editable state. `verifyGate`
   checks that the gate belongs to this release, validates evidence, and stamps
   the authenticated user and server time.
6. DeepSpace subscriptions update the open clients after the write.

## Rules that must survive future changes

- **All application writes use actions.** Direct client writes are denied even
  for app admins. Action tools bypass those permissions, so every action must
  perform its own release membership checks.
- **Only drafts are editable.** Creation becomes a draft only after the lead
  membership and all five gates exist. Interrupted setup stays non-editable.
- **Approval is rechecked on the server.** It needs the exact gate set, valid
  verified evidence, an active independent reviewer, and the release lead.
  A disabled browser button is only guidance, not authorization.
- **Read, validate, and decide under one lock.** Otherwise an evidence edit can
  race with approval. The lock serializes operations; it does not roll back
  several writes after a crash. Keep external network calls outside this lock.
- **Record tools execute locally inside the locked room.** Calling that same
  room through its binding would wait on the lock already held by this action.
- **Reports use the snapshot.** The final status and its snapshot are saved on
  the same release record. Exports must never rebuild a decision from live gates.
- **Activity is secondary.** A failed activity entry returns a warning after a
  successful write. It must not report the main operation as failed.
- **Do not retry writes automatically.** A lost response may mean the operation
  was saved. Refresh and inspect before retrying creation.
- **Integrations are opt-in.** The empty integration allowlist prevents the
  scaffold from exposing unused owner-billed services.

## Verification

`npm run validate` checks TypeScript and pure unit tests; `npm run lint` checks
the code. Run `npx deepspace test run e2e --port 5181` for the browser suite with
real auth and records. `npm run build` produces the deployable build.

The unit tests cover policy/evidence rules and snapshot independence. The browser
tests cover the complete two-user workflow, outsiders, direct-write refusal,
invalid requests, concurrent approvals/edits, reconnects, reports, exports, and
mobile layouts. The external catalog boundary is controlled only for its
loading/error tests; application actions and records stay real.

## Architecture

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

## Operational limits and personal verification


- `npm audit` reports **one low-severity esbuild advisory**, no moderate/high/critical findings. Installed esbuild 0.27.7 is pulled by the pinned SDK/build tooling. The advisory affects esbuild's Windows `servedir` server; the deployed app runs on Cloudflare Workers, not that server. The normal compatible `npm audit fix --dry-run` offers no version change. Avoid an untested transitive override immediately before submission; upgrade the SDK/build chain with compatibility testing later. [Advisory](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr).
- Human review does not certify the truth of linked evidence. Approval captures the latest evidence, not its full revision history.
- No multi-record crash rollback, deletion, membership removal, or interrupted-setup repair UI. Retrying creation after an ambiguous network failure can duplicate a release. These limitations are documented in README.
- Automated tests use Chromium. Phone-sized browser checks are not a substitute for testing a physical phone or Safari.
- The portal text supplied in this chat conflicts on integration count. Do not count authentication/storage/subscriptions as three external integrations. The submission clearly explains why none were added.

## Applicant's personal walkthrough (not yet credited as completed)

1. Open the live app and sign in. Create a clearly named demonstration release.
2. Sign in using a different account in another browser profile. Copy its reviewer ID and add it from the lead account.
3. Enter evidence for all five gates as lead. Confirm approval remains disabled until the reviewer verifies a gate.
4. Verify one gate as reviewer and watch the lead's view update. Approve as lead.
5. Reload the report, download the JSON, and confirm the saved evidence. Confirm editing is unavailable after approval.
6. Open the workspace link with an unrelated account and confirm access is denied. Check the app on your phone.
7. Add only the checks you personally performed to the portal writeup. Be ready to explain the action authorization boundary, independent-review rule, and why serialization is not rollback.

The app is not submitted to the careers portal by this audit.

