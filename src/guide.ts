import { semanticChecks, semanticVersion } from './semantic';
import { version as applicationVersion } from '../package.json';
import { validate } from './validator';
import { examples } from './examples';
import { guideEn as g } from './guide.en';

const source = 'https://github.com/flexiblepower/s2-json/blob/d58b2f027c7b40374e8d57aee72d1876ed9e0763/';
export function mountGuide(host: HTMLElement) {
  // All markup below comes from the maintained English dictionary, never user input.
  host.innerHTML = `<div class="guide-heading"><p class="eyebrow">${g.eyebrow}</p><h2>${g.title}</h2><p>${g.intro}</p></div>
  <nav class="guide-nav" aria-label="${g.navigation}">${g.sections.map((s, i) => `<a href="#guide-${i + 1}">${i + 1}. ${s}</a>`).join('')}</nav>
  <div id="guide-overview"><h3>${g.overviewTitle}</h3><p>${g.overviewText}</p><div class="overview-cards">${g.sections.map((title,i) => `<a href="#guide-${i+1}"><span>0${i+1}</span><strong>${title}</strong><p>${g.overviewDescriptions[i]}</p><b aria-hidden="true">→</b></a>`).join('')}</div></div><div class="guide-grid">
  <section id="guide-1" class="guide-card" aria-labelledby="guide-title-1"><span class="guide-tag">${g.catalogTag}</span><h3 id="guide-title-1">01 · ${g.sections[0]}</h3><p>${g.catalogIntro}</p>
  <dl class="rule-catalog">${g.rules.map(r => `<div><dt><code>${r.id}</code> · ${r.title}</dt><dd><strong>${r.status}</strong><p>${r.description}</p><a href="${source + r.file}" target="_blank" rel="noreferrer">${r.reference}</a></dd></div>`).join('')}</dl><p class="guide-note">${g.catalogNote}</p></section>
  <section id="guide-2" class="guide-card" aria-labelledby="guide-title-2"><span class="guide-tag">${g.demoTag}</span><h3 id="guide-title-2">02 · ${g.sections[1]}</h3><p>${g.layersIntro}</p>
  <ol class="layer-list">${g.layers.map(l => `<li><strong>${l.title}</strong><span>${l.status}</span><p>${l.description}</p></li>`).join('')}</ol><p class="guide-note">${g.layersNote}</p></section>
  <section id="guide-3" class="guide-card" aria-labelledby="guide-title-3"><span class="guide-tag">${g.demoTag}</span><h3 id="guide-title-3">03 · ${g.sections[2]}</h3><p>${g.testsIntro}</p><ul>${g.tests.map(s => `<li>${s}</li>`).join('')}</ul><button id="run-guide-tests">${g.runTests}</button><div id="guide-test-results" role="status" aria-live="polite"></div><p class="guide-note">${g.testsNote}</p></section>
  <section id="guide-4" class="guide-card" aria-labelledby="guide-title-4"><span class="guide-tag">${g.demoTag}</span><h3 id="guide-title-4">04 · ${g.sections[3]}</h3><p>${g.evidenceIntro}</p><ul>${g.evidence.map(s => `<li>${s}</li>`).join('')}</ul><details><summary>${g.sampleTitle}</summary><pre id="guide-sample"></pre></details><button id="download-guide-report">${g.download}</button><p id="guide-download-status" role="status" aria-live="polite"></p><p class="guide-note">${g.evidenceNote}</p></section>
  </div><a class="guide-index-link" href="#verification-guide">← ${g.allTopics}</a><p class="guide-boundary">${g.boundary}</p>`;
  const sample = JSON.stringify(examples.Handshake, null, 2);
  host.querySelector('#guide-sample')!.textContent = sample;
  host.querySelector('#run-guide-tests')!.addEventListener('click', () => {
    const missing = { ...examples.Handshake } as Partial<typeof examples.Handshake>;
    delete missing.message_id;
    const cases = [
      {label:g.demoCases[0], data:examples.Handshake, expected:true, keyword:undefined},
      {label:g.demoCases[1], data:missing, expected:false, keyword:'required'},
      {label:g.demoCases[2], data:{...examples.Handshake,role:'DEVICE'}, expected:false, keyword:'enum'}
    ];
    const list = document.createElement('ul');
    for (const c of cases) {
      const result = validate(JSON.stringify(c.data));
      const matched = result.schema === c.expected && (!c.keyword || result.issues.some(i => i.rule.startsWith(c.keyword! + ' ·')));
      const li = document.createElement('li'); li.textContent = `${matched ? g.testPass : g.testFail} — ${c.label}`; list.append(li);
    }
    host.querySelector('#guide-test-results')!.replaceChildren(list);
  });
  const button = host.querySelector<HTMLButtonElement>('#download-guide-report')!;
  button.addEventListener('click', async () => {
    const status = host.querySelector('#guide-download-status')!;
    button.disabled = true;
    try {
      const bytes = new TextEncoder().encode(sample);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const result = validate(sample);
      const report = {
        kind:'educational-example', reportVersion:'1.0.0', application:'S2 Message Doctor', applicationVersion,
        schema:{version:'v1.0.0',commit:'d58b2f027c7b40374e8d57aee72d1876ed9e0763'},
        ruleCatalog:{version:'guide-1',semanticVersion,scope:'Illustrative entries, not an exhaustive semantic rule set'},
        input:{source:'Built-in Handshake example; no editor content',encoding:'UTF-8',serialization:'JSON.stringify(example, null, 2), no trailing newline',sha256:Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('')},
        results:{json:result.json,schema:result.schema,semantics:semanticChecks(result),context:'not checked',implementation:'not checked'},
        executed:['Strict JSON parsing','Pinned Handshake schema and its references; format assertions enabled','HS-001 description check'],
        omitted:['Semantic conditions outside the three implemented description checks','Conversation context','Implementation behavior'],
        technicalErrors:result.technical, disclaimer:g.boundary
      };
      const url = URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
      const a = document.createElement('a'); a.href=url; a.download='s2-example-evidence.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(url),1000); status.textContent=g.downloaded;
    } catch { status.textContent=g.downloadFailed; }
    finally { button.disabled=false; }
  });
}
