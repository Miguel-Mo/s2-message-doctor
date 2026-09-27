import {it,expect} from 'vitest';
import {validate} from '../src/validator';
import {semanticChecks} from '../src/semantic';
import {fieldsFor} from '../src/reference';
import {evidence} from '../src/evidence';
import {examples} from '../src/examples';
const checks=(data:unknown)=>semanticChecks(validate(JSON.stringify(data)));
it('expected type validates remaining fields without inserting message_type',()=>{
  const raw='{"role":"BAD"}';const r=validate(raw,'Handshake');
  expect(r.schema).toBe(false);expect(r.issues.map(i=>i.path)).toEqual(expect.arrayContaining(['/message_type','/message_id','/role']));
  expect(JSON.parse(r.formatted!)).toEqual({role:'BAD'});
});
it('expected type detects mismatch instead of replacing message_type',()=>{
  const r=validate(JSON.stringify(examples.Handshake),'ResourceManagerDetails');
  expect(r.issues.some(i=>i.path==='/message_type'&&i.rule.startsWith('const'))).toBe(true);
});
it('reference resolves enum refs and nested array properties',()=>{
  expect(fieldsFor('Handshake').find(f=>f.path==='/role')?.constraints).toContain('CEM');
  const ranges=fieldsFor('PEBC.PowerConstraints').find(f=>f.path==='/allowed_limit_ranges')!;
  expect(ranges.children.find(f=>f.path.endsWith('/range_boundary'))?.children[0].type).toBe('number');
  expect(fieldsFor('Handshake').find(f=>f.path==='/message_id')?.required).toBe(true);
});
it('RM versions are a separate description check, optional for CEM',()=>{
  const {supported_protocol_versions:_,...rm}=examples.Handshake;
  expect(validate(JSON.stringify(rm)).schema).toBe(true);
  expect(checks(rm)[0].status).toBe('failed');
  expect(checks({...rm,role:'CEM'})[0].status).toBe('not-applicable');
  expect(checks(examples.Handshake)[0].status).toBe('passed');
});
it('range checks pass equality and fail reversed ranges with exact path',()=>{
  const data=structuredClone(examples['PEBC.PowerConstraints']);
  data.allowed_limit_ranges[0].range_boundary={start_of_range:0,end_of_range:0};
  expect(checks(data)[1].status).toBe('passed');
  data.allowed_limit_ranges[0].range_boundary.start_of_range=1;
  expect(checks(data)[1]).toMatchObject({status:'failed',path:'/allowed_limit_ranges/0/range_boundary'});
});
it('requires both PEBC limit directions',()=>{
  const data=structuredClone(examples['PEBC.PowerConstraints']);data.allowed_limit_ranges[1].limit_type='UPPER_LIMIT';
  expect(checks(data)[2].status).toBe('failed');
  expect(checks(examples['PEBC.PowerConstraints'])[2].status).toBe('passed');
});
it('does not claim semantic success for invalid or unsupported shapes',()=>{
  expect(checks({...examples.Handshake,role:'BAD'})[0].status).toBe('not-checked');
  const data={...examples['PEBC.PowerConstraints'],allowed_limit_ranges:[null,null]};
  expect(checks(data)[1].status).toBe('not-checked');
  expect(semanticChecks(validate('{')).every(c=>c.status==='not-checked')).toBe(true);
});
it('portable report omits values and fingerprints exact original bytes',async()=>{
  const input='{"message_type":"Handshake","role":"VERY_PRIVATE_VALUE"}';
  const report=await evidence(input,validate(input));
  expect(JSON.stringify(report)).not.toContain('VERY_PRIVATE_VALUE');
  expect(report.input.sha256).toHaveLength(64);
  expect((await evidence(input+' ',validate(input+' '))).input.sha256).not.toBe(report.input.sha256);
  expect(report.results.context).toBe('not-checked');
});
