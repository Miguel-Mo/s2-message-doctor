// Dedicated English dictionary for the educational guide; ready for another locale.
export const guideEn = {
  overviewTitle: 'A little context, when you need it.', overviewText: 'Choose a topic below. Your message stays in the validator while you explore.', allTopics: 'All guide topics', overviewDescriptions: ['Where the rules come from and which ones are enforced.', 'Understand the difference between syntax, schema and protocol checks.', 'See how deliberate mistakes help test the checker.', 'Inspect a downloadable example report and its limits.'],
  eyebrow:'UNDERSTAND THE CHECKS', title:'What does a validation result actually tell you?',
  intro:'Explore four ways to build confidence in a message. No JSON input needed. These examples are separate from your editor.',
  navigation:'Verification guide sections', sections:['Traceable rules','Separate results','Testing the validator','Evidence you can inspect'],
  catalogTag:'Illustrative rule catalog', demoTag:'Built-in demonstration',
  catalogIntro:'A useful rule needs an identifier, a version, a source and a clear scope. Here are three entries tied to the pinned S2 JSON v1.0.0 schemas.',
  rules:[
    {id:'GUIDE-HS-001',title:'Handshake message_id',status:'Implemented · schema constraint',description:'The required list includes message_id. Removing it produces a schema error. This local rule ID is for this guide, not an identifier assigned by the standard.',file:'messages/Handshake.schema.json',reference:'Source: Handshake → required'},
    {id:'GUIDE-HS-002',title:'RM protocol versions',status:'Implemented separately · schema description',description:'The description says supported_protocol_versions is mandatory for RM and optional for CEM. The executable required list does not express that condition. Schema success alone does not establish it; the separate HS-001 description check now covers it.',file:'messages/Handshake.schema.json',reference:'Source: Handshake → supported_protocol_versions'},
    {id:'GUIDE-PEBC-001',title:'Range boundaries',status:'Implemented separately · schema description',description:'The range_boundary description says the start must be less than or equal to the end. The separate PEBC-001 description check compares these values after schema success.',file:'schemas/PEBC.AllowedLimitRange.schema.json',reference:'Source: PEBC.AllowedLimitRange → range_boundary'}
  ],
  catalogNote:'Catalog version: guide-1. This is a teaching subset, not a complete list of S2 requirements. Descriptions and tool recommendations must not be presented as independently verified normative clauses.',
  layersIntro:'Consider the built-in valid Handshake. Passing one layer does not imply passing the next.',
  layers:[
    {title:'JSON syntax',status:'Passes for this example',description:'The text can be parsed as strict JSON.'},
    {title:'Pinned S2 schema',status:'Passes for this example',description:'The fields satisfy the executable constraints in S2 JSON v1.0.0.'},
    {title:'Semantic coherence',status:'HS-001 passes for this example',description:'Three description-based checks are implemented for Handshake and PEBC.PowerConstraints. This is a limited subset; other semantic conditions remain unchecked.'},
    {title:'Conversation and implementation',status:'Not checked',description:'A single message cannot demonstrate sequencing, negotiated capabilities, reference existence or device behavior.'}
  ],
  layersNote:'“Not checked” is never a pass. These are example results, not an assessment of the text in your editor.',
  testsIntro:'We also need evidence that the checker detects the right failures. Run three small checks against the real validator without entering or changing a message.',
  tests:['Positive case: a valid Handshake should pass.','Negative case: remove message_id and expect a required-field error.','Mutation case: replace role with DEVICE and expect an enum error.'],
  runTests:'Run built-in checks',demoCases:['Valid Handshake accepted','Missing message_id detected','Unknown role detected'],testPass:'Expected result observed',testFail:'Unexpected result',
  testsNote:'These three demonstrations are not the full automated test suite. The project also tests boundary cases, source locations, offline behavior and accessibility. Agreement between validators can reveal discrepancies but does not prove complete conformity.',
  evidenceIntro:'An evidence report should say exactly what was checked and what was omitted. Download a real, locally generated report for the built-in Handshake.',
  evidence:['Pinned schema version and commit.','Report and illustrative catalog versions.','Separate results and explicit omitted checks.','SHA-256 fingerprint of the exact example text.'],
  sampleTitle:'Inspect the exact example text',download:'Download example evidence',downloaded:'Example evidence downloaded. Your editor content was not used.',downloadFailed:'Could not generate the example report. This browser must support local Web Crypto.',
  evidenceNote:'The fingerprint identifies the checked bytes. It is not a signature or proof of correctness. This sample export is not an export of your own validation report.',
  boundary:'S2 Message Doctor is an independent development aid. Passing validation does not prove complete protocol conformity or certification.'
};
