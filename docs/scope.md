# Scope and technical decisions

## What this checks

One JSON message, processed entirely in the browser. The tool separates:

1. **JSON syntax**: strict JSON; comments and trailing commas fail. Parse errors show one-based line and column.
2. **S2 schema validation**: selects one of the 36 message schemas by `message_type`, then evaluates its executable JSON Schema constraints with AJV's 2020-12 implementation. AJV format assertions are enabled through ajv-formats (including date-time). All internal references are registered locally before compilation. Errors retain AJV keyword, instancePath, schemaPath, parameters and message in the technical section.
3. **Tool warnings and selection limits**: with automatic detection, missing/unknown message_type or a non-object root cannot select a schema and are shown as “Not checked”, not an invented S2 rule. Duplicate keys and numbers beyond JavaScript's safe numeric range skip schema validation. Input is limited to 1 MiB and 100 nesting levels before parsing. These are tool policies, not requirements of S2.

The source of truth is the unmodified vendored schema. There is no coercion, default insertion, property removal or automatic repair. Formatting changes whitespace only, preserving number lexemes, strings and duplicate keys. Missing-field navigation selects the nearest existing parent. Other errors select their exact value in the formatted text. Paths use RFC 6901 JSON Pointer escaping; the empty pointer denotes the root.

## What this does not check

No message sequencing, RM–CEM state, capability negotiation, referenced message/object existence, ID uniqueness across a session, timing, physical feasibility or all textual conditions in the standard. No WebSockets, simulators, connection proxy, account, database or backend. This tool is not a replacement for reading the standard or testing an implementation.

**Known upstream gaps**: many object-shaped schemas do not declare `type: object`; for example, a ResourceManagerDetails with `roles: [null]` can pass the pinned schema. The Handshake description says supported_protocol_versions is mandatory for RM, but its executable required list does not express that condition. ID uses an unanchored pattern rather than enforcing all of its UUID description. These rules are not silently strengthened. Regression tests explicitly preserve the first behavior. A persistent tool warning and the disclaimer qualify a successful result.

JavaScript numbers use IEEE 754; ordinary fractional values have normal floating-point limitations. Out-of-range numbers are not trusted for schema validation. The source is never reserialized for formatting.

## Research and version pin (2026-09-27)

- [s2-json tags](https://github.com/flexiblepower/s2-json/tags): `v1.0.0`, `v0.0.2-beta`, `v0.0.1-beta`. GitHub's releases endpoint returned no releases; these are Git tags, not GitHub release assets.
- Selected [v1.0.0 commit d58b2f027c7b40374e8d57aee72d1876ed9e0763](https://github.com/flexiblepower/s2-json/tree/d58b2f027c7b40374e8d57aee72d1876ed9e0763), the stable versioned tag, not a moving branch.
- Every vendored schema declares `https://json-schema.org/draft/2020-12/schema`. Original `$id` values use the previous repository name `s2-ws-json` and remain unchanged. AJV 2020 resolves the registered IDs and relative references without network I/O.
- [Upstream Apache-2.0 license](https://github.com/flexiblepower/s2-json/blob/d58b2f027c7b40374e8d57aee72d1876ed9e0763/LICENSE), section 4, permits redistribution with license and notice preservation and marking modifications. We retain exact schema bytes, LICENSE and README. No upstream NOTICE exists at this revision. `vendor/s2-json/manifest.json` records SHA-256 digests. The app uses Apache-2.0 too. No standard text beyond the upstream schema files is redistributed.
- [s2-python](https://github.com/flexiblepower/s2-python/tree/ea46bde1598ee9e73a1313bbdbc59722d6e047c6), v0.10.0, Apache-2.0: inspected `src/s2python/s2_parser.py`, `validate_values_mixin.py` and generated definitions. It dispatches by message_type to Pydantic classes and wraps Pydantic errors. Model parsing/serialization is a different contract from applying the original JSON Schema and may perform conversions. This app validates unchanged JSON values directly; no Python code was copied.
- [s2-analyzer](https://github.com/flexiblepower/s2-analyzer/tree/1a37ba6db52394bc02cad79be7226e78b8b60719): inspected README and backend connection/validation flow. It forwards RM–CEM messages, uses s2-python validation and records sessions in SQLite for a frontend. No license file was found in that revision and the API license field was null; redistribution rights were not assumed. No code/assets were copied. Its proxy, session and persistence features are deliberately outside this MVP.

## Architecture

TypeScript + Vite, plain HTML/CSS, native textarea and jsonc-parser source offsets. A heavier editor is unnecessary for one small message. JSON parsing uses strict jsonc-parser options and JSON.parse only after a successful parse. Copy and download preserve the currently displayed text, including invalid JSON. Text from the message is rendered only through textContent, never HTML.

AJV 8's [draft 2020-12 implementation](https://ajv.js.org/json-schema.html#draft-2020-12) is compatible with the schema. `strictTypes: false` allows upstream's omitted object types; all other strict checks remain enabled. Runtime AJV compilation requires `unsafe-eval` in CSP. Scripts/styles are bundled inline to allow direct `file://` opening, requiring `unsafe-inline`. This is a deliberate offline portability tradeoff; user content never enters scripts or HTML. `connect-src 'none'`, no fetch/loadSchema, and a browser offline test guard against outbound content transfer.

No cookies, localStorage, IndexedDB, service worker, telemetry or remote storage. Clipboard and local downloads occur only through the corresponding buttons. Sensitive-looking field values are hidden in error previews; ordinary strings are truncated to 160 characters, complex values are not duplicated. The full original message remains visible in the editor and is never sent to a service.

English copy is centralized in `src/i18n.ts`; new dictionaries can preserve its shape. Technical AJV output remains original English. Accessibility uses native controls, visible focus, live status, labeled editor, keyboard-operable error navigation and non-color status labels. The responsive layout stacks on mobile. Automated browser checks are not a full accessibility audit.

## Required disclaimer

S2 Message Doctor is an independent development aid. Passing validation does not prove complete protocol conformity or certification.

## Error guidance and learning examples

Error locations refer to the displayed, formatted JSON (or original text for syntax failures). Enum choices and fixed values come directly from AJV schema error parameters. Date-time examples are illustrative and numeric hints do not replace other schema constraints. Missing-field hints identify the existing parent using a JSON Pointer. Four deliberately invalid examples have separate learning notes and are never silently repaired.

Accessibility regression tests use axe-core only in the test browser, keyboard Tab/Enter navigation, live issue counts, and CSS zoom reflow. No runtime accessibility service or external script is introduced.

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
