# S2 Message Doctor

A small independent, open-source development aid for inspecting **one S2 JSON message**. Paste or load JSON, validate against the pinned schema, and jump from readable errors to the affected field. No backend, accounts, cookies, analytics or remote storage.

**S2 JSON v1.0.0** · JSON Schema 2020-12 · upstream commit `d58b2f027c7b40374e8d57aee72d1876ed9e0763`.

> S2 Message Doctor is an independent development aid. Passing validation does not prove complete protocol conformity or certification.

## Install and develop

Requires Node.js 22.12+ (Node 24 recommended) and npm. From this independent project directory:

```sh
npm install
npm test
npm run build
npm run dev
```

Open the local Vite URL printed in the terminal. Development may require allowing Vite's own hot-reload connection; the production CSP blocks connections. The app itself has no network API. `npm ci` is recommended for reproducible installs from the committed lockfile.

## Build and use offline

```sh
npm run build
```

Open **dist/index.html** directly in a browser, including with the network disconnected. All code, CSS and schemas are bundled in the HTML, and third-party notices are embedded. No HTTP server is required. `npm run preview` is an optional static preview, not an application backend.

The initial dependency installation needs a network connection or a populated npm cache. After installation, build, unit tests and the built app require no Internet access. The build reads only the vendored schemas. Clipboard permissions vary with browser/file origins; if Copy is unavailable, the tool selects the editor and explains how to copy manually.

## Test

```sh
npm run verify:schemas
npm test
npm run build
npx playwright install chromium firefox webkit
npm run test:browser
```

The first Playwright browser installation needs network access. The browser tests in Chromium, Firefox and WebKit then open the built file with its context offline, validates all three examples, checks field navigation, hostile text, file loading, download and mobile overflow, and asserts no HTTP(S) requests or page errors. Screenshots are saved as `docs/desktop.png` and `docs/mobile.png`.

## GitHub Pages

Push this project as its own GitHub repository. Under **Settings → Pages → Build and deployment**, select **GitHub Actions**. The included workflow tests and builds on pushes and pull requests. Pushes to `main` and manually triggered workflows on `main` deploy `dist` to Pages. Relative asset handling supports repository subpaths; there are no routing rewrites.

For other static hosts, upload the contents of `dist/`, retaining LICENSE and third-party notices. Nothing is published automatically from a local build. The public project uses GitHub Pages; the application performs all message processing locally.

## Schema provenance and updates

`vendor/s2-json/v1.0.0/` contains the unmodified upstream messages, supporting schemas, LICENSE and README. `vendor/s2-json/manifest.json` records the exact commit and file digests. No schema is downloaded at runtime or during a normal build.

To independently reproduce the source, clone [flexiblepower/s2-json](https://github.com/flexiblepower/s2-json) and checkout `d58b2f027c7b40374e8d57aee72d1876ed9e0763`, then compare `messages/`, `schemas/`, LICENSE and README with the vendor directory. Disable Git line-ending conversion for byte-identical comparisons. Run `npm run verify:schemas` to check the committed digests.

Upgrading the schema is an explicit maintenance change: select and review a new immutable commit, preserve notices, place it in a new versioned directory, regenerate digests, update the validator import and visible version, and rerun tests. Never replace the schemas silently with the latest branch.

## Learning and accessibility

The example selector separates valid messages from four intentionally invalid learning examples. Each learning note explains a manual correction. Errors show line/column in the displayed JSON, enum options from the schema, numeric/date-time hints and the parent object for missing fields. The tool never applies these suggestions automatically.

Automated offline browser tests include axe-core checks, keyboard error navigation and 200% CSS zoom reflow. See [verification details](docs/verification.md) for coverage and limitations.

## Limits and licensing

See [docs/scope.md](docs/scope.md) for research, schema gaps, technical decisions and the precise validation boundary. Syntax validity, schema validity and tool warnings are separate. Some descriptive protocol conditions are not machine-enforced by the upstream schemas. This app does not inspect connections or conversations.

Source code: Apache-2.0, see [LICENSE](LICENSE). Upstream schemas: Apache-2.0. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for provenance and dependencies. No code from s2-analyzer or s2-python is included.

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

## Result summary and reference panel

The top summary combines schema and additional-check outcomes so a schema pass cannot hide a description-check failure. Not-checked and not-applicable results remain distinct. The field reference opens in a non-modal side panel on desktop and a compact bottom panel on mobile without changing the editor layout. Close it with its close button or Escape. Closing returns keyboard focus to the opener.

`npm run test:browser` runs six scenarios in each of Chromium, Firefox and WebKit. These Playwright builds are browser-engine coverage, not a claim that every Safari/Firefox version or platform has been tested.

On Windows and Linux, the WebKit test runner cannot navigate file URLs with its offline flag. Its tests instead block HTTP(S) requests before opening the local file; Chromium and Firefox use offline mode. See docs/verification.md for this distinction. Existing #validator and #guide-N links remain supported and normalize to #/ routes.
