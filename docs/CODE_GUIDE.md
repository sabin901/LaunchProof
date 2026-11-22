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

No test count is a guarantee of perfect correctness. See `AUDIT.md` and README
for the remaining operational limitations and the applicant's manual walkthrough.
