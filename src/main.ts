import { semanticChecks } from './semantic';
import { evidence, downloadJSON } from './evidence';
import { fieldsFor, type Field } from './reference';
import { mountGuide } from './guide';
import './style.css';
import { validate, position, MAX_BYTES, validators, type Report } from './validator';
import { examples, learningExamples } from './examples';
import { t } from './i18n';

const app = document.querySelector<HTMLDivElement>('#app')!;
// Only trusted dictionary strings enter this template. User content uses textContent.
app.innerHTML = `<header><a class="brand" href="#validator" aria-label="S2 Message Doctor — home"><span class="logo" aria-hidden="true">S2<span>+</span></span>${t.brand}</a><nav class="primary-nav" aria-label="Main navigation"><a id="nav-validator" href="#validator">${t.validatorNav}</a><a id="nav-guide" href="#verification-guide">${t.guideNav}</a></nav><span class="local"><i></i>${t.local}</span></header>
<main><div id="validator-view"><section class="intro"><p class="eyebrow">${t.eyebrow}</p><h1>${t.title}</h1><p>${t.intro}</p><span class="version">${t.schema}</span></section>
<div class="workspace"><section class="panel editor-panel" aria-labelledby="editor-title"><div class="panel-heading"><h2 id="editor-title"><span class="step">01</span>${t.editor}</h2><button id="load">${t.load}<span aria-hidden="true"> ↥</span></button><input type="file" id="file" accept=".json,application/json" hidden></div>
<div class="example-row"><label for="example">${t.example}</label><select id="example"><option value="">${t.examplePlaceholder}</option></select></div>
<details class="schema-tools"><summary>${t.schemaTools}</summary><label for="expected-type">${t.expectedType}</label><select id="expected-type"><option value="">${t.autoType}</option></select><p>${t.expectedHelp}</p><button id="open-reference" aria-expanded="false" aria-controls="reference-panel">${t.fieldReference} ↗</button></details><div id="lesson" class="lesson" hidden></div><label class="sr-only" for="editor">${t.editor}</label><textarea id="editor" spellcheck="false" autocapitalize="off" autocomplete="off" aria-describedby="editor-help lesson" placeholder='{"message_type": "Handshake", …}'></textarea>
<p id="editor-help" class="editor-help">${t.editorHelp}</p><div class="toolbar"><button class="primary" id="validate">${t.validate}<span aria-hidden="true"> →</span></button><button id="copy">${t.copy}</button><button id="download">${t.download}</button><button id="clear">${t.clear}</button></div></section>
<section class="panel report-panel" aria-labelledby="report-title"><div class="panel-heading"><h2 id="report-title"><span class="step">02</span>${t.results}</h2></div><div id="report"></div></section></div>
<p id="notice" role="status" aria-live="polite" aria-atomic="true"></p><div class="bottom"><p>${t.privacy}</p><details><summary>${t.provenance}</summary><p><a href="https://github.com/flexiblepower/s2-json/tree/d58b2f027c7b40374e8d57aee72d1876ed9e0763" target="_blank" rel="noreferrer">${t.source}</a> · ${t.schema}</p><p>${t.license}</p><p class="commit">${t.commit}</p><p>${t.formatPolicy}</p></details></div>
<div class="guide-teaser"><div><strong>${t.guideTeaserTitle}</strong><p>${t.guideTeaserText}</p></div><a href="#verification-guide">${t.guideNav} <span aria-hidden="true">↗</span></a></div></div><div id="guide-view" hidden><a class="back-link" href="#validator">← ${t.backToValidator}</a><div id="verification-guide"></div></div><aside id="reference-panel" aria-labelledby="reference-title" hidden><div class="reference-heading"><h2 id="reference-title">${t.fieldReference}</h2><button id="close-reference" aria-label="${t.closeReference}">×</button></div><p>${t.referenceNote}</p><div id="field-reference"></div></aside><footer>${t.disclaimer}</footer></main>`;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const editor = $<HTMLTextAreaElement>('editor');
const output = $('report');
const select = $<HTMLSelectElement>('example');
const expected = $<HTMLSelectElement>('expected-type');
let validationInput = '';
const file = $<HTMLInputElement>('file');
const notice = (text: string) => { $('notice').textContent = text; };
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text: string, className = '') { const el = document.createElement(tag); el.textContent = text; el.className = className; return el; }
const validGroup = document.createElement('optgroup'); validGroup.label = t.validExamples;
for (const key of Object.keys(examples)) { const option = node('option', key); option.value = key; validGroup.append(option); }
const invalidGroup = document.createElement('optgroup'); invalidGroup.label = t.invalidExamples;
for (const [key, example] of Object.entries(learningExamples)) { const option = node('option', example.label); option.value = key; invalidGroup.append(option); }
select.append(validGroup, invalidGroup);
for (const type of [...validators.keys()].sort()) { const option = node('option',type); option.value=type; expected.append(option); }
function updateReference(type = expected.value) {
  const target=$('field-reference'); target.replaceChildren();
  const fields=fieldsFor(type);
  if(!fields.length){target.append(node('p',t.chooseReference));return;}
  target.append(node('strong',type));
  function renderFields(items:Field[],parent:HTMLElement){
    for(const field of items){
      const details=document.createElement('details'); details.className='field-entry';
      details.append(node('summary',field.path),node('p',`${field.required===null?t.arrayItem:field.required?t.requiredField:t.optionalField} · ${field.type}`),node('p',field.description));
      if(field.constraints)details.append(node('p',field.constraints,'rule'));
      renderFields(field.children,details);parent.append(details);
    }
  }
  renderFields(fields,target);
}
expected.addEventListener('change',()=>{reset(true);updateReference();notice('');});
updateReference();
function closeReference(){ $('reference-panel').hidden=true; $('open-reference').setAttribute('aria-expanded','false'); }
$('open-reference').addEventListener('click',()=>{const opening=$('reference-panel').hidden; $('reference-panel').hidden=!opening; $('open-reference').setAttribute('aria-expanded',String(opening)); if(opening)$('close-reference').focus();});
$('close-reference').addEventListener('click',()=>{closeReference();$('open-reference').focus();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('reference-panel').hidden){closeReference();$('open-reference').focus();}});
function clearLesson() { $('lesson').hidden = true; $('lesson').replaceChildren(); }
function reset(stale = false) { updateReference(); output.replaceChildren(node('div', '{ }', 'empty-symbol'), node('h3', stale ? t.stale : t.ready), node('p', t.readyHelp)); output.className = 'empty'; }
function goTo(offset: number, length: number) { editor.focus(); editor.setSelectionRange(offset, offset + length); const p = position(editor.value, offset); editor.scrollTop = Math.max(0, (p.line - 4) * 22); editor.scrollIntoView({block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}); notice(t.selection(p.line, p.column)); }
function render(result: Report) {
  output.replaceChildren(); output.className = '';
  const semantics=semanticChecks(result);
  const failures=semantics.filter(c=>c.status==='failed').length;
 
  const passed=semantics.filter(c=>c.status==='passed').length;
  const skipped=semantics.some(c=>c.status==='not-checked');
  const headline=result.schema===true ? failures ? t.combinedFail(failures) : skipped ? t.combinedSkipped : passed ? t.combinedPass(passed) : t.combinedNone : result.schema===false||result.json===false ? t.failed : t.unsupported;
  const summary=node('div',headline,`overall-summary ${failures||result.schema===false||result.json===false?'attention':'neutral'}`);summary.id='overall-summary';output.append(summary);
  const status = node('div', '', 'status-grid');
  for (const [label, value] of [[t.json, result.json], [t.s2, result.schema]] as const) { const item = node('div', '', value === true ? 'status pass' : value === false ? 'status fail' : 'status'); item.append(node('span', label), node('strong', value === null ? t.notChecked : value ? '✓ ' + t.valid : '× ' + t.invalid)); status.append(item); }
  output.append(status);
  if (result.selectedType) output.append(node('p', `${t.selectedSchema}: ${result.selectedType}`, 'message-type'));
  if (result.messageType) output.append(node('p', result.messageType, 'message-type'));
  output.append(node('h3', result.schema === true ? t.passed : result.schema === false || result.json === false ? t.failed : t.unsupported));
  if (result.schema === true) output.append(node('p', t.noErrors));
  const list = node('ol', '', 'issues');
  for (const issue of result.issues) {
    const li = document.createElement('li');
    const jump = node('button', issue.path || t.root, 'path'); jump.addEventListener('click', () => goTo(issue.offset, issue.length));
    const location = position(editor.value, issue.offset);
    li.append(jump, node('p', t.location(location.line, location.column), 'location'), node('p', issue.explanation));
    if (issue.hint) li.append(node('p', issue.hint, 'hint'));
    if (issue.value) li.append(node('p', `${t.value}: ${issue.value}`, 'value'));
    li.append(node('p', `${t.rule}: ${issue.rule}`, 'rule')); list.append(li);
  }
  output.append(list);
  if (result.warnings.length) { const section = node('div', '', 'warnings'); section.append(node('h4', t.warnings)); for (const warning of result.warnings) section.append(node('p', warning)); output.append(section); }
  const semanticSection=node('details','','semantic-results');
  semanticSection.open=failures>0;
  semanticSection.append(node('summary',`${t.semanticTitle} · ${semantics.filter(c=>c.status==='passed').length} passed · ${failures} failed · ${semantics.filter(c=>c.status==='not-checked').length} not checked`),node('p',t.semanticNote));
  for(const check of semantics){
    const row=node('div','','semantic-check');row.append(node('strong',`${check.id} · ${check.status}`),node('p',check.explanation));
    if(check.status==='failed')row.append(node('code',check.path));
    const link=node('a',t.semanticSource);link.href=check.source;link.target='_blank';link.rel='noreferrer';row.append(link);semanticSection.append(row);
  }
  output.append(semanticSection);
  const details = document.createElement('details'); details.append(node('summary', t.technical), node('pre', JSON.stringify(result.technical, null, 2))); output.append(details);
  const exportButton=node('button',t.exportReport); exportButton.id='export-report';
  const originalInput=validationInput;
  exportButton.addEventListener('click',async()=>{
    exportButton.disabled=true;
    try {downloadJSON(await evidence(originalInput,result),'s2-validation-report.json');notice(t.reportDownloaded);}catch{notice(t.reportFailed);}finally{exportButton.disabled=false;}
  });
  output.append(exportButton,node('p',t.reportPrivacy,'report-privacy'));
  updateReference(result.selectedType || expected.value);
  notice(result.issues.length ? t.errorSummary(result.issues.length) : headline);
}
$('validate').addEventListener('click', () => { validationInput=editor.value; const result = validate(editor.value,expected.value || undefined); if (result.formatted !== undefined) editor.value = result.formatted; render(result); });
editor.addEventListener('input', () => { select.value = ''; reset(true); notice(''); });
select.addEventListener('change', () => {
  const learning = learningExamples[select.value as keyof typeof learningExamples];
  const example = learning?.message ?? examples[select.value as keyof typeof examples];
  clearLesson();
  if (example) {
    expected.value='';
    editor.value = JSON.stringify(example, null, 2); reset(); notice('');
    if (learning) { $('lesson').append(node('strong', t.lessonLabel), node('p', learning.lesson)); $('lesson').hidden = false; }
  }
});
$('load').addEventListener('click', () => file.click());
file.addEventListener('change', async () => { const chosen = file.files?.[0]; file.value = ''; if (!chosen) return; if (!chosen.name.toLowerCase().endsWith('.json')) return notice(t.fileType); if (chosen.size > MAX_BYTES) return notice(t.limit); try { editor.value = await chosen.text(); expected.value=''; clearLesson(); select.value = ''; reset(); notice(''); } catch { notice(t.fileFailed); } });
$('clear').addEventListener('click', () => { editor.value = ''; expected.value=''; clearLesson(); select.value = ''; reset(); notice(''); editor.focus(); });
$('copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(editor.value); notice(t.copied); } catch { editor.focus(); editor.select(); notice(t.copyFailed); } });
$('download').addEventListener('click', () => { const url = URL.createObjectURL(new Blob([editor.value], {type: 'application/json'})); const a = document.createElement('a'); a.href = url; a.download = 's2-message.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notice(t.downloaded); });
reset();

mountGuide(document.getElementById("verification-guide")!);

function showRoute(moveFocus = false) {
  closeReference();
  const hash = window.location.hash.replace(/^#\//, '#');
  // Routes use #/ to avoid native anchor scrolling after reload in WebKit.
  if (hash && window.location.hash === hash) history.replaceState(null, '', hash.replace('#', '#/'));
  const isGuide = hash === '#verification-guide' || /^#guide-[1-4]$/.test(hash);
  $('validator-view').hidden = isGuide;
  $('guide-view').hidden = !isGuide;
  for (const [id, current] of [['nav-validator', !isGuide], ['nav-guide', isGuide]] as const) {
    if (current) $(id).setAttribute('aria-current', 'page'); else $(id).removeAttribute('aria-current');
  }
  const selected = /^#guide-[1-4]$/.test(hash) ? hash.slice(1) : null;
  document.querySelectorAll<HTMLElement>('.guide-card').forEach(card => { card.hidden = selected !== card.id; });
  document.querySelectorAll<HTMLAnchorElement>('.guide-nav a').forEach(link => {
    if (link.hash === hash) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
  });
  $('guide-overview').hidden = selected !== null;
  window.scrollTo(0, 0);
  if (moveFocus) {
    const target = isGuide ? (selected ? document.querySelector<HTMLElement>(`#${selected} h3`) : document.querySelector<HTMLElement>('.guide-heading h2')) : document.querySelector<HTMLElement>('h1');
    target?.setAttribute('tabindex','-1'); target?.focus({preventScroll:true});
  }
}
history.scrollRestoration = 'manual';
window.addEventListener('load', () => requestAnimationFrame(() => showRoute()));
window.addEventListener('hashchange', () => showRoute(true));
showRoute();
