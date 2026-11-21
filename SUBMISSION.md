# LaunchProof submission

LaunchProof preserves the evidence and reasoning behind software release sign-off. Reviewers record human attestations against five production-release gates. An authenticated lead may approve only when every gate has evidence and at least one was verified by another active reviewer. Each decision saves a historical snapshot and makes the release read-only.

DeepSpace capabilities used: built-in authentication, RecordRoom storage and team RBAC, live useQuery subscriptions, authenticated server actions, multi-user testing fixtures, and Cloudflare Worker/RecordRoom runtime. DeepSpace production hosting verified.

Source: https://github.com/sabin901/LaunchProof

Live URL: https://launchproof-sabin901.app.space

External integrations: none added. We prioritized a complete collaborative workflow and adversarial authorization tests over optional AI summaries or email.

Key tradeoff: one fixed production-release policy and human-attested evidence, not automatic CI certification. Actions serialize within the existing RecordRoom; this is not crash rollback, cryptographic immutability, or a claim of unlimited scale.

Codex generated and tested the implementation. Local verification: 10 unit tests, 19 browser tests, typecheck, lint, and production build. These cover actual multi-user synchronization, direct record access controls, independent-review enforcement, concurrency, final-state locks and report persistence. All 19 browser tests also passed against production on November 21, 2026, including the complete two-person approval flow. Production error logs returned zero events in the checked window.

Developer's personal verification: add only checks you actually perform; agent-run tests are listed separately above.

