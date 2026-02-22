// ── State ──────────────────────────────────────────────────────
let provider = 'claude';
let boardData = null;

// ── Provider ───────────────────────────────────────────────────
function setProvider(p) {
  provider = p;
  document.getElementById('btnClaude').classList.toggle('active', p === 'claude');
  document.getElementById('btnGemini').classList.toggle('active', p === 'gemini');

  if (p === 'claude') {
    document.getElementById('apiKey').placeholder = 'sk-ant-api03-…';
    document.getElementById('keyLabel').innerHTML = 'API Key <span class="key-hint">(<a href="https://console.anthropic.com" target="_blank">get yours free</a>)</span>';
  } else {
    document.getElementById('apiKey').placeholder = 'AIza…';
    document.getElementById('keyLabel').innerHTML = 'API Key <span class="key-hint">(<a href="https://aistudio.google.com/app/apikey" target="_blank">get yours free</a>)</span>';
  }
}

// ── Chip selection ─────────────────────────────────────────────
document.querySelectorAll('#areaChips .chip').forEach(btn => {
  btn.addEventListener('click', () => btn.classList.toggle('selected'));
});

let selectedVibe = '';
document.querySelectorAll('#vibeChips .vibe-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#vibeChips .vibe-chip').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedVibe = btn.dataset.val;
  });
});

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
const loadSteps = ['ls1','ls2','ls3','ls4','ls5'];
const loadPcts  = [15, 35, 55, 75, 95];
let loadTimer = null;

function startLoader() {
  showScreen('loadScreen');
  let step = 0;
  loadSteps.forEach(id => {
    document.getElementById(id).classList.remove('active','done');
  });
  document.getElementById('loadFill').style.width = '5%';
  document.getElementById('ls1').classList.add('active');

  loadTimer = setInterval(() => {
    if (step > 0) {
      document.getElementById(loadSteps[step-1]).classList.remove('active');
      document.getElementById(loadSteps[step-1]).classList.add('done');
    }
    if (step < loadSteps.length) {
      document.getElementById(loadSteps[step]).classList.add('active');
      document.getElementById('loadFill').style.width = loadPcts[step] + '%';
      step++;
    }
  }, 1200);
}

function stopLoader() {
  clearInterval(loadTimer);
  document.getElementById('loadFill').style.width = '100%';
}

// ── Build prompt ───────────────────────────────────────────────
function buildPrompt(inputs) {
  return `You are an elite life coach and vision board designer. Create a deeply personal, beautiful vision board for this person.

PERSON'S INPUTS:
- Name: ${inputs.name || 'not provided'}
- Life areas: ${inputs.areas.join(', ') || 'general life'}
- Biggest dream: ${inputs.dream}
- Biggest obstacle: ${inputs.obstacle}
- Desired aesthetic: ${inputs.vibe.replace(/_/g,' ')}
- Three words for ideal life: ${inputs.threeWords}

Respond with ONLY a raw JSON object (no markdown, no fences). Use this exact structure:

{
  "theme": "<A poetic 2-4 word theme title for this person's vision, e.g. 'The Sovereign Life' or 'Born Limitless'>",
  "hero_statement": "<One powerful, personal declaration sentence. First person. Bold and specific to their dream. E.g. 'I build empires from quiet rooms and call it freedom.'>",
  "sub_statement": "<A softer follow-up line, 8-12 words, poetic and encouraging>",
  "affirmations": [
    "<Affirmation 1 — powerful, personal, present tense, 6-10 words>",
    "<Affirmation 2>",
    "<Affirmation 3>",
    "<Affirmation 4>"
  ],
  "power_words": ["<word1>", "<word2>", "<word3>"],
  "mantra": "<A short repeatable mantra, 5-8 words, poetic>",
  "quote": "<An original motivational quote relevant to their dream. Not a famous quote — write one from scratch. In quotes. Attributed to their name.>",
  "habits": [
    "<Daily habit 1 — specific and actionable, 6-8 words>",
    "<Daily habit 2>",
    "<Daily habit 3>",
    "<Daily habit 4>",
    "<Daily habit 5>"
  ],
  "identity_statement": "<Who they are becoming. E.g. 'The person who ships before they're ready'>",
  "obstacle_reframe": "<Reframe their stated obstacle as a strength or lesson, 10-15 words>",
  "plan": {
    "month1": {
      "title": "<Evocative title for Month 1, e.g. 'The Foundation'>",
      "focus": "<1-sentence description of the month's energy>",
      "actions": [
        "<Specific action 1>",
        "<Specific action 2>",
        "<Specific action 3>",
        "<Specific action 4>"
      ]
    },
    "month2": {
      "title": "<Title for Month 2, e.g. 'The Expansion'>",
      "focus": "<1-sentence description>",
      "actions": ["<action1>","<action2>","<action3>","<action4>"]
    },
    "month3": {
      "title": "<Title for Month 3, e.g. 'The Arrival'>",
      "focus": "<1-sentence description>",
      "actions": ["<action1>","<action2>","<action3>","<action4>"]
    }
  },
  "color_story": "<Describe this person's aesthetic in 10 words, e.g. 'Midnight gold, silk shadows, candlelit rooms and raw ambition'>",
  "vibe": "${inputs.vibe}"
}`;
}

// ── API calls ──────────────────────────────────────────────────
async function callClaude(apiKey, prompt) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
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

async function callGemini(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
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

  const apiKey    = document.getElementById('apiKey').value.trim();
  const name      = document.getElementById('userName').value.trim();
  const dream     = document.getElementById('bigDream').value.trim();
  const obstacle  = document.getElementById('obstacle').value.trim();
  const threeWords = document.getElementById('threeWords').value.trim();
  const areas     = [...document.querySelectorAll('#areaChips .chip.selected')].map(c => c.dataset.val);

  if (!apiKey)    return showErr('Please enter your API key.');
  if (!dream)     return showErr('Please describe your biggest dream — this is the heart of your board.');
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
      ? await callClaude(apiKey, prompt)
      : await callGemini(apiKey, prompt);

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse the AI response. Please try again.');
    boardData = JSON.parse(match[0]);
    boardData._name = name;

    stopLoader();
    await new Promise(r => setTimeout(r, 500));

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

      <!-- Hero cell: big statement -->
      <div class="board-cell cell-hero cell-bg-2">
        <div class="cell-deco-circle"></div>
        <div class="cell-eyebrow">✦ ${d._name ? d._name + "'s Vision" : 'Your Vision'} · ${new Date().getFullYear()}</div>
        <div class="cell-headline italic">${escHtml(d.hero_statement)}</div>
        <div class="cell-body">${escHtml(d.sub_statement)}</div>
      </div>

      <!-- Theme / title cell -->
      <div class="board-cell cell-name cell-bg-accent">
        <div class="cell-eyebrow" style="opacity:.5">Your Theme</div>
        <div class="cell-headline sm" style="color:#000;font-style:italic">${escHtml(d.theme)}</div>
        <div class="cell-deco-line" style="background:#000;margin:.8rem auto"></div>
        <div class="cell-mono" style="color:rgba(0,0,0,.55)">${escHtml(d.color_story)}</div>
      </div>

      <!-- Affirmations (4 cells of span 3 each) -->
      ${d.affirmations.slice(0,4).map((aff, i) => `
      <div class="board-cell cell-word cell-bg-${i % 2 === 0 ? '2' : '3'}">
        <div class="cell-number">${i+1}</div>
        <div class="cell-eyebrow cell-accent-text">Affirmation</div>
        <div class="cell-headline xs italic">${escHtml(aff)}</div>
      </div>`).join('')}

      <!-- Identity statement -->
      <div class="board-cell cell-theme cell-bg-3">
        <div class="cell-eyebrow cell-accent-text">I am becoming</div>
        <div class="cell-headline sm italic">"${escHtml(d.identity_statement)}"</div>
      </div>

      <!-- Mantra -->
      <div class="board-cell cell-theme cell-bg-2" style="text-align:center">
        <div class="cell-eyebrow cell-accent-text">Daily Mantra</div>
        <div class="cell-headline sm" style="letter-spacing:.06em">${escHtml(d.mantra)}</div>
      </div>

      <!-- Power words -->
      <div class="board-cell cell-third cell-bg-accent" style="text-align:center;justify-content:center;gap:.6rem;display:flex;flex-direction:column">
        <div class="cell-eyebrow" style="opacity:.5">Power Words</div>
        ${d.power_words.map(w => `<div style="font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:300;color:#000;letter-spacing:.08em">${escHtml(w)}</div>`).join('<div style="width:20px;height:1px;background:rgba(0,0,0,.2);margin:0 auto"></div>')}
      </div>

      <!-- Daily habits -->
      <div class="board-cell cell-half cell-bg-3">
        <div class="cell-eyebrow cell-accent-text">Daily Habit Stack</div>
        <ul class="habit-list" style="margin-top:.5rem">
          ${d.habits.map(h => `<li>${escHtml(h)}</li>`).join('')}
        </ul>
      </div>

      <!-- Quote -->
      <div class="board-cell cell-half cell-bg-2" style="justify-content:center">
        <div class="cell-eyebrow cell-accent-text">Words to Live By</div>
        <div class="cell-body" style="font-size:1.05rem;opacity:.9;margin-top:.8rem">${escHtml(d.quote)}</div>
      </div>

      <!-- Obstacle reframe -->
      <div class="board-cell cell-third cell-bg-3" style="justify-content:center">
        <div class="cell-eyebrow cell-accent-text">Reframe</div>
        <div class="cell-body" style="opacity:.85;margin-top:.3rem">${escHtml(d.obstacle_reframe)}</div>
      </div>

      <!-- Bottom full-width brand bar -->
      <div class="board-cell cell-full cell-bg-1" style="padding:.8rem 2rem;align-items:center;flex-direction:row;justify-content:space-between;min-height:unset">
        <div style="font-family:'Cormorant Garamond',serif;font-size:1rem;color:var(--accent);letter-spacing:.2em;opacity:.4">✦ MANIFEST</div>
        <div style="font-size:.58rem;letter-spacing:.18em;text-transform:uppercase;opacity:.2">${new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'}).toUpperCase()}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:.8rem;opacity:.3;font-style:italic">${d._name ? d._name : 'My Vision'}</div>
      </div>

    </div>
  `;

  // 90-day plan
  const details = document.getElementById('boardDetails');
  const p = d.plan;
  details.innerHTML = `
    <div class="plan-header">
      <h2>Your 90-Day Plan</h2>
      <p>Three focused months. One transformed life.</p>
    </div>
    <div class="plan-grid">
      ${['month1','month2','month3'].map((m, i) => `
      <div class="plan-month">
        <div class="plan-month-label">Month ${i+1} · Days ${i*30+1}–${(i+1)*30}</div>
        <div class="plan-month-title">${escHtml(p[m].title)}</div>
        <p style="font-size:.75rem;color:#666;font-style:italic;margin-bottom:1rem">${escHtml(p[m].focus)}</p>
        <ul class="plan-items">
          ${p[m].actions.map(a => `<li>${escHtml(a)}</li>`).join('')}
        </ul>
      </div>`).join('')}
    </div>
  `;
}

// ── Helpers ────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function goBack() {
  showScreen('formScreen');
}

async function downloadBoard() {
  // Use html2canvas if available, otherwise show instructions
  const board = document.getElementById('visionBoard');
  if (typeof html2canvas !== 'undefined') {
    const canvas = await html2canvas(board, { scale: 2, backgroundColor: null, useCORS: true });
    const a = document.createElement('a');
    a.download = 'my-vision-board.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  } else {
    // Load html2canvas dynamically
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = async () => {
      const canvas = await html2canvas(board, { scale: 2, backgroundColor: '#080808', useCORS: true, logging: false });
      const a = document.createElement('a');
      a.download = (boardData?._name || 'my') + '-vision-board.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    document.head.appendChild(script);
  }
}

function shareBoard() {
  const text = boardData
    ? `✦ I just created my vision board with Manifest AI!\n\nMy theme: "${boardData.theme}"\n\nManifest yours:`
    : '✦ I just created my vision board with Manifest AI!';

  if (navigator.share) {
    navigator.share({ title: 'My Vision Board — Manifest', text, url: window.location.href })
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  navigator.clipboard.writeText(text + '\n' + window.location.href).then(() => {
    const btn = document.querySelector('.tool-btn:last-child');
    const orig = btn.textContent;
    btn.textContent = '✓ Link copied!';
    setTimeout(() => btn.textContent = orig, 2500);
  });
}
