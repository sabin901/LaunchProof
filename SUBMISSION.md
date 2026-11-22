# LaunchProof submission

Live URL: https://launchproof-sabin901.app.space

Repository: https://github.com/sabin901/LaunchProof

## Writeup

LaunchProof is a collaborative software-release sign-off workspace. A lead creates a release with five verification gates, reviewers record evidence, and approval requires all five gates plus at least one attestation from another active reviewer. A final decision saves an evidence snapshot and locks further edits. Search, status filters, reviewer handoff links, and JSON/print reports support the complete workflow.

I used DeepSpace authentication, RecordRoom storage and team permissions, live useQuery subscriptions, authenticated server actions, and production hosting. No external integrations were added: AI summaries or email would not improve the core verification flow enough to justify the extra scope. Unconfigured integration calls are blocked.

The main tradeoff is a fixed release policy with human-attested evidence instead of automatic CI verification. Actions serialize within one RecordRoom to protect decisions from concurrent edits; this is not crash rollback or cryptographic immutability. Next I would add evidence revision history and recovery for interrupted setup.

I directed Codex on the scope, independent-review requirement, public repository, and visual design. Codex implemented the app and tests, inspected SDK behavior, and ran typecheck, lint, 13 unit tests, and the browser suite against real authentication and records. The pre-submission audit expanded the suite to 21 browser tests and closed an unused integration billing route. Agent-run checks cover multi-user sync, access isolation, concurrent decisions, read-only final reports, exports, and mobile layout.

## Before pasting into the portal

- Personally complete the two-account walkthrough in AUDIT.md, then add one sentence saying exactly what you checked. Do not describe agent-run tests as your own manual verification.
- The supplied portal copy conflicts: its main instructions say no minimum integration count, while its lower project-bar panel says at least three. This project uses native DeepSpace capabilities and zero external integrations; keep that distinction explicit.

The final code pass organized the four actions into named workflow steps, documented the authorization and concurrency boundaries inline, and added a short code-reading guide in docs/CODE_GUIDE.md.

Final verification on November 22, 2026: all 21 browser tests passed against the deployed app; the checked production error-log window was empty.
