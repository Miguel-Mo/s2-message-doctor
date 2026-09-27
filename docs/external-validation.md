# Public implementation fixture audit

Tested against S2 JSON v1.0.0 (d58b2f027c7b40374e8d57aee72d1876ed9e0763) and description-check catalog 1.0.0.

**These are public implementation test fixtures and documentation examples, not captured production traffic.** No independent device interoperability or certification is demonstrated.

| Source | Cases | Schema pass | Schema fail | Not checked |
| --- | ---: | ---: | ---: | ---: |
| [flexiblepower/s2-python](https://github.com/flexiblepower/s2-python) | 45 | 41 | 4 | 0 |
| [hupe1980/s2-kit](https://github.com/hupe1980/s2-kit) | 42 | 42 | 0 | 0 |
| [stekker/s2-ruby](https://github.com/stekker/s2-ruby) | 4 | 1 | 1 | 2 |

91 distinct-per-source inputs cover 22 recognized message types. All 91 parse as JSON. 84 satisfy the pinned schema, five fail it and two cannot select a schema. None of the applicable implemented description checks fail in the schema-passing subset. This is not a general success rate: the corpus deliberately includes negative tests and is not a random production sample.

## Interpretation of non-passing cases

- [stekker/s2-ruby: spec/s2/message_factory_spec.rb:33](https://github.com/stekker/s2-ruby/blob/4175477526a0bf2209858e52b7ac72e354f5409f/spec/s2/message_factory_spec.rb#L33) — Deliberate negative test: missing message_type; correctly not checked.
- [stekker/s2-ruby: spec/s2/message_factory_spec.rb:46](https://github.com/stekker/s2-ruby/blob/4175477526a0bf2209858e52b7ac72e354f5409f/spec/s2/message_factory_spec.rb#L46) — Deliberate negative test: UnknownType; correctly not checked.
- [stekker/s2-ruby: spec/s2/message_factory_spec.rb:60](https://github.com/stekker/s2-ruby/blob/4175477526a0bf2209858e52b7ac72e354f5409f/spec/s2/message_factory_spec.rb#L60) — Deliberate negative test: role missing; required error.
- [flexiblepower/s2-python: tests/unit/inheritance_test.py:38](https://github.com/flexiblepower/s2-python/blob/ea46bde1598ee9e73a1313bbdbc59722d6e047c6/tests/unit/inheritance_test.py#L38) — Intentional subclass extension: measurement_timestamp is accepted by an extended Python class, but prohibited by the unchanged upstream FRBC.StorageStatus schema. This is an expected scope difference, not evidence of a broken implementation.
- [flexiblepower/s2-python: tests/unit/pebc/pebc_power_constraints_test.py:161](https://github.com/flexiblepower/s2-python/blob/ea46bde1598ee9e73a1313bbdbc59722d6e047c6/tests/unit/pebc/pebc_power_constraints_test.py#L161) — Deliberate negative test: only a lower-limit entry; minItems rejects a one-element array. Separate description checks are skipped after schema failure.
- [flexiblepower/s2-python: tests/unit/pebc/pebc_power_constraints_test.py:187](https://github.com/flexiblepower/s2-python/blob/ea46bde1598ee9e73a1313bbdbc59722d6e047c6/tests/unit/pebc/pebc_power_constraints_test.py#L187) — Deliberate negative test: only an upper-limit entry; minItems rejects a one-element array.
- [flexiblepower/s2-python: tests/unit/s2_parser_test.py:56](https://github.com/flexiblepower/s2-python/blob/ea46bde1598ee9e73a1313bbdbc59722d6e047c6/tests/unit/s2_parser_test.py#L56) — Deliberate negative test: missing message_id; required error.

## Acquisition and limits

- s2-kit contributes 42 distinct inputs from 43 fixture files; one byte-identical input was deduplicated within that source. Its tests identify them as S2 documentation examples reused by the implementation, not independently generated device traces.
- s2-python contributes 45 literal messages extracted statically from tests. Literal strings retain their content; literal Python dictionaries are serialized to JSON without changing field values. Dynamic constructors, interpolation and expressions are not executed or extracted. Tests may use older protocol-version strings: the schema allows arbitrary strings and does not prove successful negotiation.
- s2-ruby contributes four JSON heredocs, with indentation removed as Ruby squiggly heredocs do. Three are deliberate negatives. No external application code is executed.
- flexiblepower/s2-example-implementations was inspected at 51c7c452df9c0bb3400f064a97bbc254f1e22f8e, but its generated Rust messages were not counted as captured JSON.
- An older indexed PV documentation example shows reversed bounds; the pinned s2-kit PV fixture instead contains -4000 to 0 and passes PEBC-001. The indexed example was not added to this implementation corpus; do not conflate the versions.
- Source commits, file paths, extraction kind, SHA-256 and every result are in [external-results.json](external-results.json). Inputs are in the local ignored external-corpus directory, not bundled into the app or redistributed with the project. Apache-2.0 s2-python/s2-ruby and MIT/Apache-2.0 s2-kit licenses remain in their source checkouts; provenance of documentation-derived content is kept distinct.

## Reproduce

Requires Python 3, Git and the usual npm dependencies. Acquisition is an explicit network operation; tests and the application never fetch these inputs automatically. The script clones absent source repositories into TEMP (or /tmp), pins exact commits, and rejects existing checkouts at a different revision.

```sh
python scripts/collect-external.py
npx vitest run tests/external.test.ts
npx playwright test external --project=chromium
```

The first command stores the optional corpus locally. Without it, the external tests are skipped. The browser run pastes all 91 cases into the built application, validates and compares the displayed schema verdict to the recorded core result. It is a UI consistency check, not an independent validation oracle.
