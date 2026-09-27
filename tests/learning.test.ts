import { expect, it } from 'vitest';
import { learningExamples } from '../src/examples';
import { position, validate } from '../src/validator';
it.each(Object.entries(learningExamples))('%s explains an intentionally invalid example', (_, example) => {
  const result = validate(JSON.stringify(example.message));
  expect(result.json).toBe(true);
  expect(result.schema).toBe(false);
  expect(result.issues).toHaveLength(1);
  expect(result.issues[0].hint).toBeTruthy();
});
it('enum hints come from the original schema', () => {
  const r = validate(JSON.stringify(learningExamples['unknown-enum'].message));
  expect(r.issues[0].hint).toBe('Allowed values: "CEM", "RM".');
});
it('missing nested fields identify and select the correct parent', () => {
  const message = structuredClone(learningExamples['numeric-text'].message) as any;
  message.instruction_processing_delay = 100;
  delete message.roles[0].commodity;
  const r = validate(JSON.stringify(message));
  expect(r.issues[0].hint).toContain('/roles/0');
  const selected = r.formatted!.slice(r.issues[0].offset, r.issues[0].offset + r.issues[0].length);
  expect(JSON.parse(selected)).toEqual({role:'ENERGY_PRODUCER'});
  expect(position(r.formatted!, r.issues[0].offset).line).toBeGreaterThan(1);
});
