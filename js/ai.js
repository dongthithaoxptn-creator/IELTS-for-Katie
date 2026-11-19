/* Claude API client: IELTS examiner-style marking for Writing & Speaking, translations, vocab generation.
   Static, build-free page, so this calls the Messages API over HTTPS with fetch (the key stays on this device). */
(function (App) {
  'use strict';
  const S = App.store, U = App.util;
  const API = 'https://api.anthropic.com/v1/messages';

  /* ---------- Official band descriptors (IELTS, updated May 2023) — condensed from the public PDF ---------- */
  const WRITING_DESCRIPTORS = `
OFFICIAL IELTS WRITING BAND DESCRIPTORS (public version, May 2023) — condensed. A script must FULLY fit the positive features of a band to be awarded it. Negative features ("limiting" features) cap the band.

TASK ACHIEVEMENT (Task 1, Academic)
9: All requirements fully and appropriately satisfied; extremely rare lapses in content.
8: Covers all requirements appropriately, relevantly and sufficiently. Key features skilfully selected, clearly presented, highlighted and illustrated. Occasional omissions/lapses.
7: Covers the requirements. Content relevant and accurate (a few omissions/lapses); format appropriate. Key features covered and clearly highlighted but could be more fully illustrated. Presents a CLEAR OVERVIEW; data appropriately categorised; main trends/differences identified.
6: Focuses on requirements; appropriate format. Key features covered and adequately highlighted. A relevant overview is ATTEMPTED. Information appropriately selected and supported with figures. Some irrelevant, inappropriate or inaccurate detail; some details missing or excessive.
5: Generally addresses the task; format may be inappropriate in places. Key features NOT adequately covered; recounting of detail is mainly mechanical; may be no data to support the description. May focus on details without the bigger picture (NO clear overview). Irrelevant/inaccurate material in key areas; limited detail.
4: An attempt to address the task. Few key features selected; format may be inappropriate; key features presented may be irrelevant, repetitive or inaccurate.
3: Does not address the requirements (misunderstanding of data); limited information, used repetitively.

TASK RESPONSE (Task 2)
9: Prompt appropriately addressed and explored in depth. Clear, fully developed position directly answering the question(s). Ideas relevant, fully extended, well supported.
8: Prompt appropriately and sufficiently addressed. Clear, well-developed position. Ideas relevant, well extended and supported; occasional omissions/lapses.
7: Main parts of the prompt appropriately addressed. Clear and developed position. Main ideas extended and supported but may over-generalise or lack focus/precision in supporting ideas.
6: Main parts addressed (some more fully than others); appropriate format. Position directly relevant, but conclusions may be unclear, unjustified or repetitive. Main ideas relevant but some insufficiently developed or unclear; some support less relevant or inadequate.
5: Main parts INCOMPLETELY addressed; format may be inappropriate in places. Position expressed but development not always clear. Some main ideas, but limited and not sufficiently developed and/or irrelevant detail; some repetition.
4: Prompt tackled minimally or tangentially. Position discernible only on careful reading. Main ideas difficult to identify, may lack relevance/clarity/support. Large parts repetitive.
3: No part adequately addressed / prompt misunderstood. No relevant position. Few, irrelevant or undeveloped ideas.

COHERENCE & COHESION (both tasks)
9: Message followed effortlessly. Cohesion very rarely attracts attention. Paragraphing skilfully managed.
8: Followed with ease. Logically sequenced; cohesion well managed; occasional lapses. Paragraphing sufficient and appropriate.
7: Logically organised with clear progression throughout (a few minor lapses). Range of cohesive devices incl. reference and substitution used flexibly, with some inaccuracies or some over/under-use. (T2) Paragraphing generally effective; sequencing within paragraphs generally logical.
6: Generally arranged coherently with clear overall progression. Cohesive devices used to some good effect but cohesion within/between sentences may be faulty or MECHANICAL due to misuse, overuse or omission. Reference/substitution may lack flexibility or clarity -> repetition or error. (T2) Paragraphing may not always be logical; central topic not always clear.
5: Organisation evident but not wholly logical; may lack overall progression; underlying coherence. Sentences not fluently linked. Limited/overuse of cohesive devices with some inaccuracy. Repetitive due to inadequate reference/substitution. (T2) Paragraphing may be inadequate or missing.
4: Ideas evident but not arranged coherently; no clear progression. Basic cohesive devices, inaccurate or repetitive. Lack of referencing. (T2) May be no paragraphing.

LEXICAL RESOURCE (both tasks)
9: Full flexibility and precise use widely evident. Wide range used accurately and appropriately with very natural, sophisticated control. Minor spelling/word-formation errors extremely rare.
8: Wide resource fluently and flexibly used for precise meanings. Skilful use of uncommon and/or idiomatic items, despite occasional inaccuracies in word choice and collocation. Occasional spelling/word-formation errors, minimal impact.
7: Resource sufficient to allow SOME flexibility and precision. Some ability to use less common/idiomatic items. Awareness of style and collocation evident, though inappropriacies occur. Only a few spelling/word-formation errors that do not detract from clarity.
6: Resource generally adequate and appropriate. Meaning generally clear despite a rather restricted range or lack of precision. Risk-takers: wider range but more inaccuracy. Some spelling/word-formation errors, not impeding communication.
5: Resource limited but minimally adequate. Simple vocabulary may be accurate but range does not permit much variation. Frequent lapses in appropriacy; frequent simplifications/repetitions. Noticeable spelling/word-formation errors that may cause some difficulty.
4: Limited and inadequate or unrelated; basic, repetitive vocabulary. Inappropriate memorised chunks/formulaic language/language lifted from the input. Errors may impede meaning.

GRAMMATICAL RANGE & ACCURACY (both tasks)
9: Wide range with full flexibility and control. Punctuation and grammar appropriate throughout. Minor errors extremely rare.
8: Wide range flexibly and accurately used. MAJORITY of sentences error-free; punctuation well managed. Occasional non-systematic errors, minimal impact.
7: A variety of complex structures used with some flexibility and accuracy. Grammar and punctuation generally well controlled; error-free sentences FREQUENT. A few errors may persist but do not impede communication.
6: A mix of simple and complex sentence forms but flexibility limited. Complex structures not as accurate as simple ones. Errors in grammar and punctuation occur but rarely impede communication.
5: Range limited and rather repetitive. Complex sentences attempted but tend to be faulty; greatest accuracy on simple sentences. Grammatical errors may be frequent and cause some difficulty. Punctuation may be faulty.
4: Very limited range; subordinate clauses rare, simple sentences predominate. Errors frequent and may impede meaning. Punctuation often faulty.

Other official rules: responses of 20 words or fewer = Band 1. Copied rubric is discounted. Memorised/off-topic answers are penalised. Task 1 minimum 150 words, Task 2 minimum 250 words — under-length scripts are penalised (mainly in Task Achievement/Response; very short scripts also lack evidence for LR/GRA). Overall writing band = Task 2 counts double Task 1.`;

  const SPEAKING_DESCRIPTORS = `
OFFICIAL IELTS SPEAKING BAND DESCRIPTORS (public version) — condensed. A candidate must fully fit the positive features of a band; rated on average performance across all parts.
FLUENCY & COHERENCE — 9: fluent, only very occasional repetition/self-correction; hesitation only content-related; fully coherent, appropriately extended. 8: fluent, very occasional repetition/self-correction; hesitation mostly content-related; coherent, relevant development. 7: keeps going, long turns without noticeable effort; some hesitation/repetition/self-correction mid-sentence when accessing language, not affecting coherence; flexible use of discourse markers and connectives. 6: willing to produce long turns; coherence may be lost at times through hesitation/repetition/self-correction; range of discourse markers not always appropriate. 5: usually keeps going but relies on repetition, self-correction and/or slow speech; mid-sentence searches for basic lexis/grammar; overuse of certain discourse markers. 4: noticeable pauses; slow, frequent repetition; links simple sentences with repetitive connectives; some breakdowns.
LEXICAL RESOURCE — 9: total flexibility, precise, sustained accurate idiomatic language. 8: wide resource, flexible, precise; skilful less common/idiomatic items with occasional inaccuracies; effective paraphrase. 7: flexible across topics; some less common/idiomatic items, awareness of style and collocation with inappropriacies; effective paraphrase. 6: sufficient to discuss topics at length; may be inappropriate but meaning clear; generally paraphrases successfully. 5: sufficient for familiar and unfamiliar topics but limited flexibility; paraphrase attempted, not always successful. 4: sufficient for familiar topics only; frequent errors in word choice; rarely paraphrases.
GRAMMATICAL RANGE & ACCURACY — 9: precise and accurate at all times (except native-like slips). 8: wide range, flexible; majority of sentences error-free; occasional non-systematic errors; a few basic errors may persist. 7: range of structures flexibly used; error-free sentences frequent; simple and complex sentences used effectively despite some errors. 6: mix of short and complex forms, limited flexibility; errors frequent in complex structures but rarely impede communication. 5: basic forms fairly well controlled; complex structures limited, nearly always contain errors. 4: basic forms, some error-free short utterances; subordinate clauses rare; turns short; errors frequent.
PRONUNCIATION — 9: full range of phonological features; effortlessly understood. 8: wide range; sustained rhythm, flexible stress/intonation; easily understood. 7: all positive features of 6 and some of 8. 6: range of features, variable control; chunking generally appropriate; some effective intonation/stress not sustained; occasional mispronunciation; generally understood without much effort. 5: features of 4 and some of 6. 4: limited range; frequent lapses in rhythm; frequent mispronunciation causing lack of clarity.`;

  const EXAMINER_RULES = `You are a senior, certified IELTS examiner trained to the official public band descriptors. You mark STRICTLY and CONSISTENTLY, as in a real test. Do not inflate scores to encourage the candidate: an over-generous score is a failure of your job. When in doubt between two bands, award the LOWER band unless the script fully fits every positive feature of the higher band.
Procedure for each criterion: (1) collect evidence by quoting the script; (2) find the band whose descriptor the script fully fits; (3) check the next band up and state precisely which positive feature is missing; (4) check for limiting features that cap the band (e.g. no overview in Task 1 caps TA at 5; mechanical cohesion; under-length; memorised language; off-topic).
Award whole or half bands only (e.g. 5.0, 5.5, 6.0). Quote the candidate's exact words in "evidence" and in every error's "quote" field. Explain in clear English, and add a short Vietnamese gloss in brackets after technical terms where helpful (e.g. "cohesive devices (từ nối)"). Be specific and actionable.`;

  /* ---------- JSON schemas for structured output ---------- */
  const crit = { type: 'object', additionalProperties: false, required: ['band', 'summary', 'evidence', 'limiting_features', 'to_reach_next_band'],
    properties: { band: { type: 'number' }, summary: { type: 'string' }, evidence: { type: 'array', items: { type: 'string' } }, limiting_features: { type: 'array', items: { type: 'string' } }, to_reach_next_band: { type: 'string' } } };
  const strArr = { type: 'array', items: { type: 'string' } };
  const errors = { type: 'array', items: { type: 'object', additionalProperties: false, required: ['quote', 'type', 'correction', 'explanation'],
    properties: { quote: { type: 'string' }, type: { type: 'string', enum: ['grammar', 'vocabulary', 'collocation', 'spelling', 'punctuation', 'cohesion', 'register', 'task'] }, correction: { type: 'string' }, explanation: { type: 'string' } } } };
  const upgrades = { type: 'array', items: { type: 'object', additionalProperties: false, required: ['original', 'better', 'note'], properties: { original: { type: 'string' }, better: { type: 'string' }, note: { type: 'string' } } } };
  const WRITING_SCHEMA = { type: 'object', additionalProperties: false,
    required: ['criteria', 'examiner_summary', 'strengths', 'weaknesses', 'errors', 'vocabulary_upgrades', 'rewrite', 'next_steps'],
    properties: {
      criteria: { type: 'object', additionalProperties: false, required: ['task', 'cc', 'lr', 'gra'], properties: { task: crit, cc: crit, lr: crit, gra: crit } },
      examiner_summary: { type: 'string' }, strengths: strArr, weaknesses: strArr, errors, vocabulary_upgrades: upgrades,
      rewrite: { type: 'object', additionalProperties: false, required: ['original_paragraph', 'improved_paragraph', 'why'], properties: { original_paragraph: { type: 'string' }, improved_paragraph: { type: 'string' }, why: { type: 'string' } } },
      next_steps: strArr
    } };
  const SPEAKING_SCHEMA = { type: 'object', additionalProperties: false,
    required: ['criteria', 'examiner_summary', 'strengths', 'weaknesses', 'errors', 'vocabulary_upgrades', 'better_answer', 'next_steps'],
    properties: {
      criteria: { type: 'object', additionalProperties: false, required: ['fc', 'lr', 'gra', 'pron'], properties: { fc: crit, lr: crit, gra: crit, pron: crit } },
      examiner_summary: { type: 'string' }, strengths: strArr, weaknesses: strArr, errors, vocabulary_upgrades: upgrades,
      better_answer: { type: 'object', additionalProperties: false, required: ['question', 'model_answer'], properties: { question: { type: 'string' }, model_answer: { type: 'string' } } },
      next_steps: strArr
    } };

  async function call({ system, user, schema, max = 16000, effort = 'high', model }) {
    const key = S.s.settings.apiKey;
    if (!key) throw new Error('Add your Claude API key in Settings to use AI marking.');
    model = model || S.s.settings.model || 'claude-opus-5-5';
    const body = { model, max_tokens: max, system, messages: [{ role: 'user', content: user }], output_config: { effort } };
    if (schema) body.output_config.format = { type: 'json_schema', schema };
    const headers = { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2026-10-21', 'anthropic-dangerous-direct-browser-access': 'true' };
    const withFallback = /^claude-(opus-5|sonnet-5-5|fable)/.test(model);
    const send = async (fb) => {
      const h = Object.assign({}, headers), b = Object.assign({}, body);
      if (fb) { h['anthropic-beta'] = 'server-side-fallback-2026-07-01'; b.fallbacks = 'default'; }
      return fetch(API, { method: 'POST', headers: h, body: JSON.stringify(b) });
    };
    App.busy = true;
    let r;
    try {
      try { r = await send(withFallback); } catch (e) { if (!withFallback) throw e; r = null; }
      if (withFallback && (!r || r.status === 400)) {
        const txt = r ? await r.clone().text() : '';
        if (!r || /fallback|beta/i.test(txt)) r = await send(false);
      }
    } catch (e) { App.busy = false; throw new Error('Could not reach the Claude API (offline or blocked): ' + e.message); }
    App.busy = false;
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = (data.error && data.error.message) || ('HTTP ' + r.status);
      throw new Error(r.status === 401 ? 'Your API key was rejected. Check it in Settings.' : 'Claude API error: ' + msg);
    }
    if (data.stop_reason === 'refusal') throw new Error('The model declined this request. Try rephrasing.');
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    if (data.stop_reason === 'max_tokens' && schema) throw new Error('The response was cut off. Try again.');
    return { text, usage: data.usage, model: data.model };
  }
  function parseJSON(t) {
    try { return JSON.parse(t); } catch (e) { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); throw new Error('Could not read the marking result.'); }
  }
  const clampBand = b => Math.max(0, Math.min(9, U.roundBand(+b || 0)));

  App.ai = {
    enabled: () => !!S.s.settings.apiKey,
    WRITING_DESCRIPTORS, SPEAKING_DESCRIPTORS,
    writingPrompt(task, promptText, dataText, essay) {
      const min = task === 1 ? 150 : 250, wc = U.words(essay);
      return `IELTS Academic Writing Task ${task}. Minimum length: ${min} words. Recommended time: ${task === 1 ? 20 : 40} minutes.

TASK PROMPT:
${promptText}
${dataText ? '\nDATA SHOWN IN THE VISUAL (use this to check accuracy of figures and whether key features/overview are covered):\n' + dataText + '\n' : ''}
CANDIDATE'S RESPONSE (${wc} words, counted by software):
"""
${essay}
"""

Mark this response against the four criteria: ${task === 1 ? 'Task Achievement' : 'Task Response'} ("task"), Coherence & Cohesion ("cc"), Lexical Resource ("lr"), Grammatical Range & Accuracy ("gra").
- List up to 20 of the most important errors (exact quote, correction, short explanation).
- Give 5-10 vocabulary upgrades (word/phrase -> more precise, natural B2-C2 alternative, with a short note).
- Rewrite the weakest paragraph at Band 8+ level, keeping the candidate's ideas.
- Give 3-5 concrete next steps ranked by impact on the band score.`;
    },
    async markWriting({ task, prompt, dataText, essay, image }) {
      const system = EXAMINER_RULES + '\n' + WRITING_DESCRIPTORS;
      let user = App.ai.writingPrompt(task, prompt, dataText || (image ? '(see the attached image of the visual)' : ''), essay);
      if (image) user = [{ type: 'image', source: { type: 'base64', media_type: image.type, data: image.data } }, { type: 'text', text: user }];
      const res = await call({ system, user, schema: WRITING_SCHEMA, effort: 'high' });
      const j = parseJSON(res.text);
      ['task', 'cc', 'lr', 'gra'].forEach(k => { j.criteria[k].band = clampBand(j.criteria[k].band); });
      const c = j.criteria;
      j.overall = U.roundBand((c.task.band + c.cc.band + c.lr.band + c.gra.band) / 4);
      if (U.words(essay) <= 20) { ['task', 'cc', 'lr', 'gra'].forEach(k => c[k].band = 1); j.overall = 1; }
      j.model = res.model;
      return j;
    },
    async markSpeaking({ parts, transcriptText, stats }) {
      const system = EXAMINER_RULES + '\n' + SPEAKING_DESCRIPTORS + `
IMPORTANT: You are given a TRANSCRIPT (from speech recognition or typed), plus timing data, not audio. Judge Fluency from the timing data and transcript features (fillers, repetition, self-correction, length of turns, words per minute; natural fluent speech is roughly 120-160 wpm). For Pronunciation you cannot hear the candidate: give an INDICATIVE band only, inferred cautiously from recognition problems (garbled or misrecognised words often signal unclear pronunciation), and say clearly in its summary that it is indicative. Speech-recognition transcripts lack punctuation — do not penalise missing punctuation.`;
      const user = `IELTS Speaking practice: ${parts}.
TIMING DATA: ${stats}

TRANSCRIPT (Q = examiner question, A = candidate answer, with speaking time):
${transcriptText}

Mark FC ("fc"), LR ("lr"), GRA ("gra") and an indicative Pronunciation band ("pron"). List up to 15 important errors with corrections, 5-8 vocabulary upgrades, and a Band 8 model answer for the question the candidate answered least well.`;
      const res = await call({ system, user, schema: SPEAKING_SCHEMA, effort: 'high' });
      const j = parseJSON(res.text);
      ['fc', 'lr', 'gra', 'pron'].forEach(k => { j.criteria[k].band = clampBand(j.criteria[k].band); });
      const c = j.criteria;
      // Headline band uses the three criteria that a transcript can show; pronunciation is indicative only
      j.overall = U.roundBand((c.fc.band + c.lr.band + c.gra.band) / 3);
      j.withPron = U.roundBand((c.fc.band + c.lr.band + c.gra.band + c.pron.band) / 4);
      j.model = res.model;
      return j;
    },
    async translate(word, ctx) {
      const res = await call({ system: 'You are an English–Vietnamese learner dictionary. Reply with ONLY the Vietnamese meaning that fits the context (max 15 words), then " — " and the part of speech in English.', user: 'Word: ' + word + (ctx ? '\nContext: ' + ctx : ''), max: 1000, effort: 'low', model: 'claude-haiku-5-5' });
      return res.text.trim();
    },
    async generateVocab(kind, topic, n) {
      const famSchema = { type: 'object', additionalProperties: false, required: ['items'], properties: { items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['r', 'ety', 'lv', 't', 'n', 'm'],
        properties: { r: { type: 'string' }, ety: { type: 'string' }, lv: { type: 'string', enum: ['B2', 'C1', 'C2'] }, t: { type: 'string' }, n: { type: 'string' },
          m: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['w', 'pos', 'ipa', 'vi', 'ex'], properties: { w: { type: 'string' }, pos: { type: 'string', enum: ['n', 'v', 'adj', 'adv'] }, ipa: { type: 'string' }, vi: { type: 'string' }, ex: { type: 'string' } } } } } } } } };
      const phSchema = { type: 'object', additionalProperties: false, required: ['items'], properties: { items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['x', 'vi', 'def', 'ex', 'lv'],
        properties: { x: { type: 'string' }, vi: { type: 'string' }, def: { type: 'string' }, ex: { type: 'string' }, lv: { type: 'string', enum: ['B2', 'C1', 'C2'] } } } } } };
      const existing = App.units.of(kind === 'families' ? 'f' : kind === 'phrasal' ? 'p' : 'c').map(u => u.title).join(', ');
      const what = kind === 'families' ? `${n} IELTS-useful WORD FAMILIES (B2–C2) on the topic "${topic}". For each: root word "r", short etymology "ety", level, topic "t", a usage note "n" (stress shifts, prepositions, common confusions), and 3–6 members "m" with word, part of speech, BRITISH IPA without slashes (e.g. ɪnˈvaɪrənmənt), Vietnamese meaning and an academic example sentence that contains the exact word form.`
        : kind === 'phrasal' ? `${n} PHRASAL VERBS at B2–C2 level useful for IELTS, topic "${topic}". "x" = the phrasal verb in base form, "vi" = Vietnamese meaning, "def" = short English definition, "ex" = example sentence that contains "x" exactly in base form.`
          : `${n} COLLOCATIONS at B2–C2 level useful for IELTS, topic "${topic}". "x" = the collocation, "vi" = Vietnamese meaning, "def" = type e.g. verb + noun, "ex" = example sentence containing "x" exactly.`;
      const res = await call({ system: 'You are an expert lexicographer for Vietnamese learners preparing for IELTS. Be accurate: British IPA, natural examples, precise Vietnamese.', user: 'Create ' + what + '\nDo not repeat these existing items: ' + existing.slice(0, 4000), schema: kind === 'families' ? famSchema : phSchema, effort: 'medium' });
      const j = parseJSON(res.text).items || [];
      if (kind === 'families') return j.map(f => ({ r: f.r, ety: f.ety, lv: f.lv, t: f.t, n: f.n, ai: true, m: f.m.map(m => [m.w, m.pos, m.ipa.replace(/\//g, ''), m.vi, m.ex]) }));
      if (kind === 'phrasal') return j.map(p => ({ p: p.x, vi: p.vi, d: p.def, ex: p.ex, lv: p.lv, ai: true }));
      return j.map(c => ({ c: c.x, vi: c.vi, ty: c.def, ex: c.ex, lv: c.lv, ai: true }));
    },
    manualPrompt(task, prompt, dataText, essay) {
      return EXAMINER_RULES + '\n' + WRITING_DESCRIPTORS + '\n\n' + App.ai.writingPrompt(task, prompt, dataText, essay) + '\n\nGive a band (0–9, half bands allowed) for each criterion with evidence, then the overall band (average of the four, rounded to the nearest half band).';
    }
  };
})(window.App);
