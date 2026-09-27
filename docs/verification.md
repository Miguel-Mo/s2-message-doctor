# Local verification

Verified on Windows with Node 24.15.0 and npm 11.13.0, 2026-09-27.

- `npm install`: completed; dependency audit reported zero vulnerabilities at installation time.
- `npm test`: 28 passing tests covering the requested minimum cases and numeric/duplicate-key/formatting/limit safeguards.
- `npm run verify:schemas`: all 79 upstream files match their recorded SHA-256 digests.
- `npm run build`: TypeScript checks and Vite build pass. The finished distribution is a single self-contained HTML plus accompanying license documents.
- Build also passed with `NODE_OPTIONS=--import=./scripts/no-network.mjs`. The guard blocks outbound Node socket, TLS, HTTP and fetch calls. The same guard is enabled for the CI build. This is a network API guard, not an operating-system network isolation test.
- `npm run test:browser`: Chromium opens the built `file://` artifact with Playwright's browser context offline. All three examples pass. The test covers field selection, malformed JSON, HTML injection text, file input, copy behavior/fallback, download, and mobile overflow. Zero HTTP(S) requests and zero page errors observed.
- Desktop (1280 px) and mobile (390 px) screenshots reviewed visually. Screenshots: `desktop.png`, `mobile.png`, `errors.png` in this directory.
- The original DER Flex working tree remained clean; this project lives in its own sibling directory.

GitHub Actions/Pages configuration is included but has not run on GitHub or been deployed. The automated browser checks cover Chromium; Firefox/Safari and assistive-technology audits have not been performed. Installation of npm dependencies and the Playwright browser initially requires network access or a suitable local cache.

## Error guidance and accessibility iteration

Four intentionally invalid learning examples now explain missing fields, numeric text, enums and date-time. Field errors include line/column, schema-derived enum choices, and parent-object guidance for missing fields.

Both Playwright tests pass offline. The new test checks real keyboard Tab/Enter navigation into the editor, live error counts, example guidance, and axe-core WCAG 2 A/AA and 2.1 AA checks in empty, invalid and valid states. Contrast failures in the eyebrow and section numbers were corrected. The tested states report no axe violations. CSS zoom at 200% with a 640px viewport checks reflow to an effective 320px width; this is not a substitute for manual browser zoom or screen-reader testing. Mobile and enlarged screenshots were visually reviewed (`learning-mobile.png`, `learning-zoom.png`). axe-core is a development-only dependency and is not bundled into the app.

## Educational verification guide

Four optional guide sections explain traceable rules, separate validation layers, validator testing and evidence reports without requiring editor input. Three local demonstration checks exercise the real validator. The example evidence download records the application version, pinned schema, illustrative catalog version, omitted checks and SHA-256 of the displayed built-in Handshake. It never reads editor content. Three separate description checks now cover Handshake and PEBC.PowerConstraints; contextual validation remains unimplemented.

Verification: 28 unit tests and three offline Chromium browser tests pass, including the existing axe accessibility checks. The guide test verifies its four sections, demonstration results, downloaded fingerprint, unchanged empty editor and mobile reflow.

## Validator-first navigation refresh

The home view now prioritizes the message editor and report. The optional educational guide has its own overview and one topic per view, with a persistent Message validator navigation link, a Back to message validator link and a clickable home logo. Hash navigation works when opening a file directly; browser Back and direct topic URLs are supported. In-page navigation preserves the current editor and validation report without storage. Reloading still clears the message by design. Desktop and mobile visuals were reviewed. A fourth offline browser test covers navigation, retained input/results, direct-link reload, home links and guide accessibility.

## Schema assistance and portable evidence

An optional expected message type selects one of the 36 pinned schemas even when message_type is missing or wrong. It never inserts or overrides JSON fields; required/const failures remain errors. The collapsible field reference derives required lists, types, descriptions and constraints from local schemas and resolves nested references (up to six levels); a missing explicit type is reported honestly.

A validation report can be downloaded for the actual last validation. It includes selected/detected types, the schema commit, application version, error paths/rules, SHA-256 of the exact UTF-8 input before formatting and separate description-check results. It omits raw JSON, field values and original error messages. Field paths may themselves contain identifiers; the UI warns users to review reports before sharing. Editing text or changing the expected type removes the stale export button. Report generation and downloads are local.

Description-check catalog 1.0.0 runs only after schema success. HS-001 checks supported_protocol_versions presence for RM using Handshake.schema.json properties.supported_protocol_versions.description. PEBC-001 checks each start_of_range <= end_of_range using PEBC.AllowedLimitRange.schema.json properties.range_boundary.description. PEBC-002 checks both UPPER_LIMIT and LOWER_LIMIT using PEBC.PowerConstraints.schema.json properties.allowed_limit_ranges.description. Sources use pinned commit URLs in each result. These are checks of upstream schema prose, not independently verified clauses of the complete standard. Unsupported shapes are not-checked; unrelated message types are not-applicable. Schema results remain unchanged. ResourceManagerDetails has no new semantic rules.

Validation: 36 unit tests and five offline browser tests, including explicit schema selection without mutation, nested reference resolution, description-rule boundaries and skips, privacy of evidence exports, stale-report invalidation and accessibility of the expanded field reference.

## Combined result and reference panel iteration

The combined result highlights additional-check failures even when the schema succeeds, including in the live status announcement. The reference panel preserves editor dimensions, supports Escape/close focus return and a mobile bottom-panel layout. A new browser scenario covers failure/success summaries and panel keyboard behavior. The browser configuration and GitHub Actions install Chromium, Firefox and WebKit. Manual screen-reader testing remains outside the automated checks.

## Cross-engine verification completed

36 unit tests and 18 browser scenarios (six each in Chromium, Firefox and WebKit). The tested builds open the built file directly. Chromium and Firefox use Playwright offline mode; Windows WebKit rejects file navigation with that flag, so tests block all HTTP(S) requests through routing instead. This limitation was isolated: the same WebKit binary successfully opens the same file without the offline flag. Network-request assertions remain active in the relevant tests. This is not an operating-system network isolation test or a test on Apple's Safari application.

WebKit exposed a native anchor-scroll jump on topic reload. Navigation now normalizes legacy #guide-N links to #/guide-N routes, retaining backward compatibility while avoiding native anchor jumps. Browser Back, reload, report download, local file loading, field selection and accessibility tests cover all three engines. The field panel can be closed with Escape and does not move or resize the editor.
