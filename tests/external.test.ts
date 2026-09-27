import {it,expect} from 'vitest';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validate} from '../src/validator';
import {semanticChecks} from '../src/semantic';
it.skipIf(!existsSync('external-corpus/manifest.json'))('audits public implementation fixtures without correcting messages',()=>{
  const manifest=JSON.parse(readFileSync('external-corpus/manifest.json','utf8'));
  const results=manifest.map((entry:any)=>{
    const input=readFileSync(`external-corpus/${entry.file}`,'utf8');
    expect(createHash('sha256').update(input).digest('hex')).toBe(entry.sha256);
    const report=validate(input);
    return {...entry,messageType:report.messageType??null,json:report.json,schema:report.schema,
      errors:report.issues.map(({path,rule,explanation})=>({path,rule,explanation})),
      additionalChecks:semanticChecks(report).filter(c=>c.status!=='not-applicable')};
  });
  writeFileSync('docs/external-results.json',JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify({total:results.length,syntaxPass:results.filter((r:any)=>r.json).length,schemaPass:results.filter((r:any)=>r.schema===true).length,schemaFail:results.filter((r:any)=>r.schema===false).length,notChecked:results.filter((r:any)=>r.schema===null).length,additionalFailures:results.filter((r:any)=>r.additionalChecks.some((c:any)=>c.status==='failed')).length}));
});
