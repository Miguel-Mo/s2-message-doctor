import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import type { ErrorObject, AnySchemaObject } from 'ajv';
import { parseTree, findNodeAtLocation, getNodeValue, format, applyEdits, printParseErrorCode, type Node, type ParseError } from 'jsonc-parser';
import { t } from './i18n';

export const schemas = Object.values(import.meta.glob('../vendor/s2-json/v1.0.0/**/*.schema.json', { eager: true, import: 'default' })) as AnySchemaObject[];
// Upstream omits type: object on many schemas. Do not silently strengthen it.
const ajv = new Ajv2020({ allErrors: true, strictTypes: false, coerceTypes: false, useDefaults: false, removeAdditional: false });
addFormats(ajv);
schemas.forEach(schema => ajv.addSchema(schema));
export const validators = new Map(schemas.filter(s => s.properties?.message_type?.const).map(s => [s.properties.message_type.const as string, ajv.getSchema(s.$id!)!]));
export const MAX_BYTES = 1024 * 1024;
export interface Issue { path: string; explanation: string; rule: string; value: string; offset: number; length: number; hint?: string }
export interface Report { json: boolean | null; schema: boolean | null; formatted?: string; messageType?: string; selectedType?: string; issues: Issue[]; warnings: string[]; technical: unknown }
export function position(text: string, offset: number) { const lines = text.slice(0, offset).split('\n'); return { line: lines.length, column: lines.at(-1)!.length + 1 }; }
const escape = (key: string) => key.replace(/~/g, '~0').replace(/\//g, '~1');
const parts = (path: string) => path === '' ? [] : path.slice(1).split('/').map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'));
function locate(root: Node, path: string): Node {
  const keys = parts(path);
  let node = root;
  for (const key of keys) { const next = findNodeAtLocation(node, [node.type === 'array' ? Number(key) : key]); if (!next) break; node = next; }
  return node;
}
function safeValue(path: string, node?: Node): string {
  if (!node) return t.missingValue;
  if (/password|token|secret|authorization|serial_number/i.test(path)) return t.hiddenValue;
  if (node.type === 'object' || node.type === 'array') return t.objectValue;
  const value = JSON.stringify(getNodeValue(node));
  return value.length > 160 ? value.slice(0, 160) + '…' : value;
}
function explain(error: ErrorObject, field: string, node: Node) {
  const p = error.params;
  switch (error.keyword) {
    case 'required': return t.required(p.missingProperty);
    case 'type': return t.type(field, p.type === 'integer' ? 'an integer' : `a ${p.type}`, node.type === 'string' ? 'text' : node.type);
    case 'enum': return t.enum(field);
    case 'additionalProperties': return t.additional(p.additionalProperty);
    case 'const': return t.const(field);
    case 'format': return t.format(field, p.format);
    case 'pattern': return t.pattern(field);
    default: return t.generic(field, error.message ?? error.keyword);
  }
}
function hint(error: ErrorObject): string | undefined {
  switch (error.keyword) {
    case 'required': return t.parentHint(error.instancePath || t.root);
    case 'enum': return t.allowed(error.params.allowedValues.map((v: unknown) => JSON.stringify(v)).join(', '));
    case 'const': return t.expectedValue(JSON.stringify(error.params.allowedValue));
    case 'format': return error.params.format === 'date-time' ? t.dateHint : undefined;
    case 'type': return ['number', 'integer'].includes(error.params.type) ? t.numericHint : undefined;
  }
}
function depthExceeded(text: string) {
  let depth = 0, quoted = false, escaped = false;
  for (const c of text) {
    if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; }
    else if (c === '"') quoted = true;
    else if (c === '{' || c === '[') { if (++depth > 100) return true; }
    else if (c === '}' || c === ']') depth--;
  }
  return false;
}
export function validate(text: string, expectedType?: string): Report {
  const report: Report = { json: null, schema: null, issues: [], warnings: [], technical: [] };
  if (new TextEncoder().encode(text).length > MAX_BYTES || depthExceeded(text)) { report.warnings.push(t.limit); return report; }
  const errors: ParseError[] = [];
  let tree = parseTree(text, errors, { disallowComments: true, allowTrailingComma: false, allowEmptyContent: false });
  if (errors.length || !tree) {
    report.json = false;
    report.technical = errors.map(e => ({ ...e, codeName: printParseErrorCode(e.error) }));
    report.issues = errors.map(e => { const p = position(text, e.offset); return { path: `line ${p.line}:${p.column}`, explanation: t.syntax(p.line, p.column), rule: printParseErrorCode(e.error), value: '', offset: e.offset, length: Math.max(e.length, 1) }; });
    return report;
  }
  report.json = true;
  report.formatted = applyEdits(text, format(text, undefined, { tabSize: 2, insertSpaces: true, eol: '\n' }));
  tree = parseTree(report.formatted)!;
  let duplicate = false, unsafeNumber = false;
  const walk = (n: Node) => {
    if (n.type === 'object') { const names = n.children!.map(c => c.children![0].value); if (new Set(names).size !== names.length) duplicate = true; }
    if (n.type === 'number' && (!Number.isFinite(n.value) || Math.abs(n.value) > Number.MAX_SAFE_INTEGER)) unsafeNumber = true;
    n.children?.forEach(walk);
  };
  walk(tree);
  if (duplicate) report.warnings.push(t.duplicate);
  if (unsafeNumber) report.warnings.push(t.precision);
  if (duplicate || unsafeNumber) return report;
  const data = JSON.parse(report.formatted);
  const selectionIssue = (path: string, explanation: string) => { const n = locate(tree!, path); report.issues.push({path, explanation, rule: 'tool: schema selection', value: safeValue(path, n), offset: n.offset, length: n.length}); };
  if (tree.type !== 'object') { selectionIssue('', t.objectRequired); return report; }
  if (!expectedType && typeof data.message_type !== 'string') { selectionIssue('/message_type', t.missingType); return report; }
  report.messageType = typeof data.message_type === 'string' ? data.message_type : undefined;
  report.selectedType = expectedType || data.message_type;
  const validator = validators.get(report.selectedType!);
  if (!validator) { selectionIssue('/message_type', t.unknownType); return report; }
  report.schema = !!validator(data);
  const raw = structuredClone(validator.errors ?? []);
  report.technical = raw;
  report.issues = raw.map(error => {
    let path = error.instancePath;
    if (error.keyword === 'required') path += '/' + escape(error.params.missingProperty);
    if (error.keyword === 'additionalProperties') path += '/' + escape(error.params.additionalProperty);
    const node = locate(tree!, path);
    return { path, explanation: explain(error, parts(path).at(-1) ?? t.root, node), hint: hint(error), rule: `${error.keyword} · ${error.schemaPath}`, value: safeValue(path, error.keyword === 'required' ? undefined : node), offset: node.offset, length: node.length };
  });
  report.warnings.push(t.schemaLimit);
  return report;
}
