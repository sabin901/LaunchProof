# Pre-submission audit — November 21, 2026

## Findings fixed

- **Owner-credit exposure:** the scaffold integration proxy defaulted unconfigured services to owner billing for any authenticated caller. LaunchProof has no external integrations, so both the public proxy and action integration helper now require an explicit allowlist entry. The list is empty. Tests verify refusal without invoking a paid provider.
- **Flaky loading test:** the scaffold catalog test expected to observe a 100 ms loading state. A fast response could finish before the assertion. Both catalog tests now hold the external response until loading has been observed; no application records or actions are mocked.
- **Partial connection states:** workspace approval readiness now waits for team membership as well as release/gate subscriptions. Membership errors surface instead of appearing as a missing independent review. Activity errors and loading states are explicit.
- **Accessibility:** the readiness progress element now has an accessible name.
- Added regressions for outsider direct record reads, direct deletion refusal, inherited action names, malformed JSON, oversized bodies, and disabled integration execution.

## Verification

- TypeScript and ESLint pass; 10 unit tests pass.
- Expanded local Playwright suite: **21 passed**, using actual auth, records, and separate user contexts. External catalog responses alone are controlled for loading/error tests.
- The initial audit production run passed 19 of 20 tests; the sole failure was the catalog loading race fixed above. All application workflow/security tests passed in that run. The final deployment is checked again before handoff; its results are reported in the accompanying chat.
- A bounded credential-pattern scan of 107 tracked files found no private-key, GitHub-token, or JWT patterns. Local credentials, dev variables, logs, and test artifacts are ignored. This is a targeted scan, not a guarantee that every possible secret format was detected.
- Production error logs returned zero events in the checked 15-minute window.
- Reviewed action authorization, team-only record permissions, URL/input validation, decision serialization, immutable application states, saved-snapshot exports, and mobile screenshots.

## Remaining limitations and judgment

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

## Final readability pass — November 22, 2026

Named action handlers now follow workflow order; evidence qualification is computed once per readiness calculation. Comments explain security and concurrency invariants. Removed unused theme metadata. A failed best-effort setup-failure marker no longer hides the original creation error. No schema or dependency changes.

Typecheck, lint, 13 unit tests and 21 local browser tests passed. See docs/CODE_GUIDE.md for the reading order.

All 21 browser tests also passed against the deployed refactor on November 22, 2026 (21.8 seconds). The production error-log query returned zero events in the checked 15-minute window.
