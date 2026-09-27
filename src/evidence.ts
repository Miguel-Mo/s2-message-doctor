import { version } from '../package.json';
import type { Report } from './validator';
import { semanticChecks, semanticVersion } from './semantic';
export async function evidence(text: string, report: Report) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return {
    reportVersion:'1.0.0',application:{name:'S2 Message Doctor',version},
    schema:{version:'v1.0.0',commit:'d58b2f027c7b40374e8d57aee72d1876ed9e0763'},
    input:{sha256:Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2,'0')).join(''),encoding:'UTF-8',scope:'Exact text supplied to validation before whitespace formatting',contentIncluded:false},
    selectedType:report.selectedType ?? null,detectedType:report.messageType ?? null,
    results:{json:report.json,schema:report.schema,semantics:semanticChecks(report),context:'not-checked',implementation:'not-checked'},
    semanticCatalog:{version:semanticVersion,basis:'Three checks sourced from pinned schema descriptions; not a complete normative assessment'},
    // No input values, raw JSON or original validator messages in the portable report.
    errors:report.issues.map(({path,rule})=>({path,rule})),warnings:report.warnings,
    disclaimer:'Independent development aid. Passing validation does not prove complete protocol conformity or certification.'
  };
}
export function downloadJSON(value: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=name;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
