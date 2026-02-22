// ── Models ────────────────────────────────────────────────────
const MODELS = {
  claude: [
    { id: 'claude-opus-4-20250514',   label: 'Claude Opus 4   — Most powerful' },
    { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 — Fast & smart (recommended)' },
    { id: 'claude-haiku-4-5-20251001',label: 'Claude Haiku 4.5 — Fastest & cheapest' },
  ],
  gemini: [
    { id: 'gemini-2.5-pro-preview-05-06', label: 'Gemini 2.5 Pro   — Most powerful' },
    { id: 'gemini-2.0-flash',             label: 'Gemini 2.0 Flash — Fast & smart (recommended)' },
    { id: 'gemini-1.5-flash',             label: 'Gemini 1.5 Flash — Lightweight' },
    { id: 'gemini-1.5-pro',               label: 'Gemini 1.5 Pro   — Balanced' },
  ]
};

// ── State ──────────────────────────────────────────────────────
let provider = 'claude';
let boardData = null;
let selectedVibe = '';

// ── Init ───────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setProvider('claude');

  document.querySelectorAll('#areaChips .chip').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('selected'));
  });
  document.querySelectorAll('#vibeChips .vibe-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#vibeChips .vibe-chip').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedVibe = btn.dataset.val;
    });
  });
});

// ── Provider toggle ────────────────────────────────────────────
function setProvider(p) {
  provider = p;
  document.getElementById('btnClaude').classList.toggle('active', p === 'claude');
  document.getElementById('btnGemini').classList.toggle('active', p === 'gemini');

  // Populate model dropdown
  const sel = document.getElementById('modelSelect');
  sel.innerHTML = MODELS[p].map(m =>
    `<option value="${m.id}">${m.label}</option>`
  ).join('');

  // Update key hint link
  const hint = document.getElementById('keyHint');
  if (p === 'claude') {
    document.getElementById('apiKey').placeholder = 'sk-ant-api03-…';
    hint.innerHTML = '(<a href="https://console.anthropic.com" target="_blank">get yours free</a>)';
  } else {
    document.getElementById('apiKey').placeholder = 'AIza…';
    hint.innerHTML = '(<a href="https://aistudio.google.com/app/apikey" target="_blank">get yours free</a>)';
  }
}

// ── Errors ─────────────────────────────────────────────────────
function showErr(msg) {
  const el = document.getElementById('errMsg');
  el.textContent = msg;
  el.classList.add('show');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideErr() { document.getElementById('errMsg').classList.remove('show'); }

// ── Screen transitions ─────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Loading animation ──────────────────────────────────────────
const LOAD_STEPS = ['ls1','ls2','ls3','ls4','ls5'];
const LOAD_PCTS  = [15, 35, 55, 75, 95];
let loadTimer = null;

function startLoader() {
  showScreen('loadScreen');
  let step = 0;
  LOAD_STEPS.forEach(id => document.getElementById(id).classList.remove('active','done'));
  document.getElementById('loadFill').style.width = '5%';
  document.getElementById('ls1').classList.add('active');
  loadTimer = setInterval(() => {
    if (step > 0) {
      document.getElementById(LOAD_STEPS[step-1]).classList.remove('active');
      document.getElementById(LOAD_STEPS[step-1]).classList.add('done');
    }
    if (step < LOAD_STEPS.length) {
      document.getElementById(LOAD_STEPS[step]).classList.add('active');
      document.getElementById('loadFill').style.width = LOAD_PCTS[step] + '%';
      step++;
    }
  }, 1200);
}

function stopLoader() {
  clearInterval(loadTimer);
  document.getElementById('loadFill').style.width = '100%';
}

// ── Prompt ─────────────────────────────────────────────────────
function buildPrompt(inputs) {
  return `You are an elite life coach and vision board designer. Create a deeply personal, beautiful vision board for this person.

PERSON'S INPUTS:
- Name: ${inputs.name || 'not provided'}
- Life areas: ${inputs.areas.join(', ') || 'general life'}
- Biggest dream: ${inputs.dream}
- Biggest obstacle: ${inputs.obstacle}
- Desired aesthetic: ${inputs.vibe.replace(/_/g,' ')}
- Three words for ideal life: ${inputs.threeWords}

Respond with ONLY a raw JSON object — no markdown, no code fences, no explanation, just the JSON. Use this exact structure:

{
  "theme": "<A poetic 2-4 word theme title for this person's vision>",
  "hero_statement": "<One powerful first-person declaration specific to their dream>",
  "sub_statement": "<A softer follow-up line, 8-12 words, poetic>",
  "affirmations": ["<Affirmation 1>","<Affirmation 2>","<Affirmation 3>","<Affirmation 4>"],
  "power_words": ["<word1>","<word2>","<word3>"],
  "mantra": "<Short repeatable mantra, 5-8 words>",
  "quote": "<Original motivational quote in double quotes, attributed to their name>",
  "habits": ["<habit 1>","<habit 2>","<habit 3>","<habit 4>","<habit 5>"],
  "identity_statement": "<Who they are becoming, e.g. 'The person who ships before they're ready'>",
  "obstacle_reframe": "<Reframe their obstacle as a strength, 10-15 words>",
  "plan": {
    "month1": { "title": "<Month title>", "focus": "<1-sentence description>", "actions": ["<a1>","<a2>","<a3>","<a4>"] },
    "month2": { "title": "<Month title>", "focus": "<1-sentence description>", "actions": ["<a1>","<a2>","<a3>","<a4>"] },
    "month3": { "title": "<Month title>", "focus": "<1-sentence description>", "actions": ["<a1>","<a2>","<a3>","<a4>"] }
  },
  "color_story": "<Describe their aesthetic in 10 evocative words>",
  "vibe": "${inputs.vibe}"
}`;
}

// ── API: Claude ────────────────────────────────────────────────
async function callClaude(apiKey, model, prompt) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model,
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error?.message || 'Claude error ' + resp.status);
  }
  const data = await resp.json();
  return data.content.map(c => c.text || '').join('');
}

// ── API: Gemini ────────────────────────────────────────────────
async function callGemini(apiKey, model, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 2500, temperature: 0.8 }
    })
  });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error?.message || 'Gemini error ' + resp.status);
  }
  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
}

// ── Generate ───────────────────────────────────────────────────
async function generate() {
  hideErr();

  const name       = document.getElementById('userName').value.trim();
  const dream      = document.getElementById('bigDream').value.trim();
  const obstacle   = document.getElementById('obstacle').value.trim();
  const threeWords = document.getElementById('threeWords').value.trim();
  const areas      = [...document.querySelectorAll('#areaChips .chip.selected')].map(c => c.dataset.val);
  const apiKey     = document.getElementById('apiKey').value.trim();
  const model      = document.getElementById('modelSelect').value;

  if (!apiKey)       return showErr('Please enter your API key.');
  if (!dream)        return showErr('Please describe your biggest dream — this is the heart of your board.');
  if (!selectedVibe) return showErr('Please choose an aesthetic vibe for your board.');

  const inputs = { name, dream, obstacle, threeWords, areas, vibe: selectedVibe };

  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  document.getElementById('btnLoader').classList.remove('hidden');
  document.getElementById('btnText').textContent = 'Manifesting…';

  startLoader();

  try {
    const prompt = buildPrompt(inputs);
    const raw = provider === 'claude'
      ? await callClaude(apiKey, model, prompt)
      : await callGemini(apiKey, model, prompt);

    // Extract JSON even if model wraps it in markdown
    const clean = raw.replace(/```json|```/g, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse AI response. Please try again.');
    boardData = JSON.parse(match[0]);
    boardData._name = name;

    stopLoader();
    await new Promise(r => setTimeout(r, 400));

    renderBoard(boardData);
    showScreen('boardScreen');

  } catch (err) {
    stopLoader();
    showScreen('formScreen');
    showErr('Error: ' + err.message);
  } finally {
    btn.disabled = false;
    document.getElementById('btnLoader').classList.add('hidden');
    document.getElementById('btnText').textContent = '✦ Manifest My Vision Board';
  }
}

// ── Render board ───────────────────────────────────────────────
function renderBoard(d) {
  const vibe = d.vibe || 'dark_luxury';
  const board = document.getElementById('visionBoard');
  board.className = `vision-board vibe-${vibe}`;

  board.innerHTML = `
    <div class="board-grid">

      <div class="board-cell cell-hero cell-bg-2">
        <div class="cell-deco-circle"></div>
        <div class="cell-eyebrow">✦ ${d._name ? d._name + "'s Vision" : 'My Vision'} · ${new Date().getFullYear()}</div>
        <div class="cell-headline italic">${esc(d.hero_statement)}</div>
        <div class="cell-body">${esc(d.sub_statement)}</div>
      </div>

      <div class="board-cell cell-name cell-bg-accent">
        <div class="cell-eyebrow" style="opacity:.5">Your Theme</div>
        <div class="cell-headline sm" style="color:#000;font-style:italic">${esc(d.theme)}</div>
        <div class="cell-deco-line" style="background:#000;margin:.8rem auto"></div>
        <div class="cell-mono" style="color:rgba(0,0,0,.55)">${esc(d.color_story)}</div>
      </div>

      ${(d.affirmations||[]).slice(0,4).map((aff, i) => `
      <div class="board-cell cell-word cell-bg-${i%2===0?'2':'3'}">
        <div class="cell-number">${i+1}</div>
        <div class="cell-eyebrow cell-accent-text">Affirmation</div>
        <div class="cell-headline xs italic">${esc(aff)}</div>
      </div>`).join('')}

      <div class="board-cell cell-theme cell-bg-3">
        <div class="cell-eyebrow cell-accent-text">I am becoming</div>
        <div class="cell-headline sm italic">"${esc(d.identity_statement)}"</div>
      </div>

      <div class="board-cell cell-theme cell-bg-2" style="text-align:center">
        <div class="cell-eyebrow cell-accent-text">Daily Mantra</div>
        <div class="cell-headline sm">${esc(d.mantra)}</div>
      </div>

      <div class="board-cell cell-third cell-bg-accent" style="text-align:center;justify-content:center;gap:.6rem;display:flex;flex-direction:column">
        <div class="cell-eyebrow" style="opacity:.5">Power Words</div>
        ${(d.power_words||[]).map(w => `<div style="font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:300;color:#000;letter-spacing:.08em">${esc(w)}</div>`).join('<div style="width:20px;height:1px;background:rgba(0,0,0,.2);margin:0 auto"></div>')}
      </div>

      <div class="board-cell cell-half cell-bg-3">
        <div class="cell-eyebrow cell-accent-text">Daily Habit Stack</div>
        <ul class="habit-list" style="margin-top:.5rem">
          ${(d.habits||[]).map(h => `<li>${esc(h)}</li>`).join('')}
        </ul>
      </div>

      <div class="board-cell cell-half cell-bg-2" style="justify-content:center">
        <div class="cell-eyebrow cell-accent-text">Words to Live By</div>
        <div class="cell-body" style="font-size:1.05rem;opacity:.9;margin-top:.8rem">${esc(d.quote)}</div>
      </div>

      <div class="board-cell cell-third cell-bg-3" style="justify-content:center">
        <div class="cell-eyebrow cell-accent-text">Reframe</div>
        <div class="cell-body" style="opacity:.85;margin-top:.3rem">${esc(d.obstacle_reframe)}</div>
      </div>

      <div class="board-cell cell-full cell-bg-1" style="padding:.8rem 2rem;align-items:center;flex-direction:row;justify-content:space-between;min-height:unset">
        <div style="font-family:'Cormorant Garamond',serif;font-size:1rem;color:var(--accent);letter-spacing:.2em;opacity:.4">✦ MANIFEST</div>
        <div style="font-size:.58rem;letter-spacing:.18em;text-transform:uppercase;opacity:.2">${new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'}).toUpperCase()}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:.8rem;opacity:.3;font-style:italic">${d._name || 'My Vision'}</div>
      </div>

    </div>`;

  // 90-day plan
  const p = d.plan || {};
  document.getElementById('boardDetails').innerHTML = `
    <div class="plan-header">
      <h2>Your 90-Day Plan</h2>
      <p>Three focused months. One transformed life.</p>
    </div>
    <div class="plan-grid">
      ${['month1','month2','month3'].map((m, i) => {
        const mo = p[m] || { title: `Month ${i+1}`, focus: '', actions: [] };
        return `
        <div class="plan-month">
          <div class="plan-month-label">Month ${i+1} · Days ${i*30+1}–${(i+1)*30}</div>
          <div class="plan-month-title">${esc(mo.title)}</div>
          <p style="font-size:.75rem;color:#666;font-style:italic;margin-bottom:1rem">${esc(mo.focus)}</p>
          <ul class="plan-items">
            ${(mo.actions||[]).map(a => `<li>${esc(a)}</li>`).join('')}
          </ul>
        </div>`;
      }).join('')}
    </div>`;
}

// ── Utilities ──────────────────────────────────────────────────
function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function goBack() { showScreen('formScreen'); }

async function downloadBoard() {
  const board = document.getElementById('visionBoard');
  const loadScript = src => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  if (typeof html2canvas === 'undefined') {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  }
  const canvas = await html2canvas(board, { scale: 2, backgroundColor: '#080808', useCORS: true, logging: false });
  const a = document.createElement('a');
  a.download = (boardData?._name || 'my') + '-vision-board.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
}

function shareBoard() {
  const text = boardData
    ? `✦ I just created my vision board with Manifest AI!\n\nMy theme: "${boardData.theme}"\n\nManifest yours:`
    : '✦ I just created my vision board with Manifest AI!';
  if (navigator.share) {
    navigator.share({ title: 'My Vision Board — Manifest', text, url: window.location.href }).catch(() => copyToClipboard(text));
  } else {
    copyToClipboard(text);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text + '\n' + window.location.href).then(() => {
    const btns = document.querySelectorAll('.tool-btn');
    const shareBtn = btns[btns.length - 1];
    const orig = shareBtn.textContent;
    shareBtn.textContent = '✓ Link copied!';
    setTimeout(() => shareBtn.textContent = orig, 2500);
  });
}
