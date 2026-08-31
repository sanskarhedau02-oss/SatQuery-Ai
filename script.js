let apiKey = localStorage.getItem('satquery_gemini_key') || '';
let currentImageBase64 = null;
let currentImageMime = null;
let currentComposition = null; // { veg, water, built, other }

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewWrap = document.getElementById('preview-wrap');
const preview = document.getElementById('preview');
const imgName = document.getElementById('img-name');
const imgSize = document.getElementById('img-size');
const chat = document.getElementById('chat');
const emptyState = document.getElementById('empty-state');
const queryInput = document.getElementById('query-input');
const askBtn = document.getElementById('ask-btn');
const keyNote = document.getElementById('key-note');
const setKeyLink = document.getElementById('set-key-link');
const analysisBlock = document.getElementById('analysis-block');

if (!apiKey) keyNote.classList.add('show');

setKeyLink.addEventListener('click', (e) => {
  e.preventDefault();
  const k = prompt('Paste your Gemini API key (from aistudio.google.com/apikey):');
  if (k) {
    apiKey = k.trim();
    localStorage.setItem('satquery_gemini_key', apiKey);
    keyNote.classList.remove('show');
  }
});

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragging'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragging');
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) handleFile(e.target.files[0]);
});

function handleFile(file) {
  if (!file.type.startsWith('image/')) { alert('Please upload an image file.'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    currentImageBase64 = dataUrl.split(',')[1];
    currentImageMime = file.type;
    preview.src = dataUrl;
    previewWrap.classList.add('show');
    dropZone.classList.add('collapsed');
    imgName.textContent = file.name;
    imgSize.textContent = (file.size / 1024).toFixed(0) + ' KB';
    runLocalAnalysis(dataUrl);
  };
  reader.readAsDataURL(file);
}

document.getElementById('change-img-btn').addEventListener('click', () => {
  dropZone.classList.remove('collapsed');
  previewWrap.classList.remove('show');
  analysisBlock.classList.remove('show');
  currentImageBase64 = null;
  currentImageMime = null;
  currentComposition = null;
  fileInput.value = '';
});

/* ---------- MODULE 1: Local pixel-composition analysis ---------- */
/* Classical color-based heuristic (no ML) run entirely client-side before
   any API call. Produces an approximate vegetation / water / built-up
   breakdown that is then handed to the model as grounding context. */
function runLocalAnalysis(dataUrl) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const size = 120; // downsample for speed
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;

    let veg = 0, water = 0, built = 0, other = 0, total = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const brightness = (r + g + b) / 3;
      total++;
      if (g > r + 12 && g > b + 8) {
        veg++;
      } else if (b > r + 10 && b >= g - 10 && brightness < 190) {
        water++;
      } else if (Math.abs(r - g) < 18 && Math.abs(g - b) < 18 && brightness > 90) {
        built++; // low-saturation grey/tan = bare soil, roads, structures
      } else {
        other++;
      }
    }
    currentComposition = {
      veg: Math.round((veg / total) * 100),
      water: Math.round((water / total) * 100),
      built: Math.round((built / total) * 100),
      other: 0
    };
    currentComposition.other = Math.max(0, 100 - currentComposition.veg - currentComposition.water - currentComposition.built);

    document.getElementById('pct-veg').textContent = currentComposition.veg + '%';
    document.getElementById('pct-water').textContent = currentComposition.water + '%';
    document.getElementById('pct-built').textContent = currentComposition.built + '%';
    document.getElementById('bar-veg').style.width = currentComposition.veg + '%';
    document.getElementById('bar-water').style.width = currentComposition.water + '%';
    document.getElementById('bar-built').style.width = currentComposition.built + '%';
    analysisBlock.classList.add('show');
  };
  img.src = dataUrl;
}

// Sample images (synthetic canvas-generated placeholders for demo continuity)
document.querySelectorAll('.sample-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const type = chip.dataset.sample;
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const colors = {
      flood: ['#1a3a5c', '#2d5a3d', '#8a7c4f'],
      urban: ['#4a4a4a', '#6b6b6b', '#8f8f8f'],
      agri: ['#3d5c2a', '#5c7d3a', '#7d9d4a']
    };
    const c = colors[type];
    for (let i = 0; i < 400; i += 20) {
      for (let j = 0; j < 300; j += 20) {
        ctx.fillStyle = c[Math.floor(Math.random() * c.length)];
        ctx.fillRect(i, j, 20, 20);
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 270, 400, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.fillText('SYNTHETIC SAMPLE — ' + type.toUpperCase() + ' SCENE (demo placeholder)', 8, 288);
    const dataUrl = canvas.toDataURL('image/png');
    currentImageBase64 = dataUrl.split(',')[1];
    currentImageMime = 'image/png';
    preview.src = dataUrl;
    previewWrap.classList.add('show');
    dropZone.classList.add('collapsed');
    imgName.textContent = 'sample_' + type + '.png (synthetic)';
    imgSize.textContent = '—';
    runLocalAnalysis(dataUrl);
  });
});

document.querySelectorAll('.sq-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    queryInput.value = chip.textContent;
    queryInput.focus();
  });
});

askBtn.addEventListener('click', sendQuery);
queryInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendQuery(); });

/* ---------- MODULE 2: Query classification / routing ---------- */
/* Keyword-based intent classifier. Each category maps to a specialized
   system-prompt template so the model reasons differently depending on
   what kind of question was asked, instead of one generic prompt for
   everything. */
const CATEGORIES = {
  'disaster': {
    label: 'Disaster / Anomaly',
    keywords: ['flood', 'flooding', 'disaster', 'damage', 'fire', 'earthquake', 'landslide', 'affected', 'destroyed', 'collapse', 'debris'],
    promptFocus: "Focus specifically on signs of disaster impact — flooding extent, structural damage, burn scars, landslide debris, or other anomalies. Compare affected vs unaffected areas where visible."
  },
  'change-detection': {
    label: 'Change Detection',
    keywords: ['change', 'compare', 'before', 'after', 'difference', 'over time', 'increased', 'decreased', 'growth', 'shrink'],
    promptFocus: "Focus on identifying features that indicate change over time — construction, deforestation edges, water-level marks, or erosion patterns visible within this single scene."
  },
  'vegetation': {
    label: 'Vegetation Health',
    keywords: ['vegetation', 'crop', 'forest', 'plant', 'agriculture', 'greenery', 'stress', 'health', 'farm', 'deforestation'],
    promptFocus: "Focus on vegetation density, canopy health, crop patterns, and any signs of stress, discoloration, or deforestation."
  },
  'land-cover': {
    label: 'Land Cover',
    keywords: ['land cover', 'land use', 'classify', 'type of land', 'terrain', 'classification', 'urban', 'settlement', 'region'],
    promptFocus: "Focus on classifying the dominant land-cover types present (urban, agricultural, forest, water, barren) and their approximate spatial distribution."
  },
  'general': {
    label: 'General Query',
    keywords: [],
    promptFocus: "Provide a general grounded description of the scene relevant to the question asked."
  }
};

function classifyQuery(query) {
  const q = query.toLowerCase();
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (key === 'general') continue;
    if (cat.keywords.some(kw => q.includes(kw))) return key;
  }
  return 'general';
}

function addMessage(role, contentHtml, isLoading) {
  emptyState.style.display = 'none';
  const msg = document.createElement('div');
  msg.className = 'msg ' + role;
  const label = role === 'user' ? 'QUERY' : 'SATQUERY AI';
  msg.innerHTML = `<div class="msg-label">${label}</div><div class="msg-bubble">${isLoading ? '<span class="loading-dots"><span></span><span></span><span></span></span>' : contentHtml}</div>`;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
  return msg;
}

/* ---------- MODULE 3: Structured report parsing ---------- */
/* Asks the model to answer in fixed sections (SUMMARY / OBSERVATIONS /
   CONFIDENCE / FOLLOWUP), then parses that plain-text contract into a
   structured report card instead of dumping a raw paragraph. */
function parseStructuredResponse(text) {
  const sections = { summary: '', observations: [], confidence: 'Medium', followup: '' };
  const summaryMatch = text.match(/SUMMARY:\s*([\s\S]*?)(?=OBSERVATIONS:|$)/i);
  const obsMatch = text.match(/OBSERVATIONS:\s*([\s\S]*?)(?=CONFIDENCE:|$)/i);
  const confMatch = text.match(/CONFIDENCE:\s*(High|Medium|Low)/i);
  const followMatch = text.match(/FOLLOWUP:\s*([\s\S]*?)$/i);

  if (summaryMatch) sections.summary = summaryMatch[1].trim();
  if (obsMatch) {
    sections.observations = obsMatch[1].split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(l => l.length > 0);
  }
  if (confMatch) sections.confidence = confMatch[1];
  if (followMatch) sections.followup = followMatch[1].trim();

  // Fallback: if the model didn't follow the format, treat whole text as summary
  if (!summaryMatch && !obsMatch) {
    sections.summary = text.trim();
  }
  return sections;
}

function renderReportCard(sections, categoryKey) {
  const confClass = sections.confidence.toLowerCase() === 'high' ? 'conf-high' : sections.confidence.toLowerCase() === 'low' ? 'conf-low' : 'conf-medium';
  let html = '<div class="report-card">';
  html += `<div class="report-section"><div class="report-section-label">SUMMARY</div><div class="report-section-body">${escapeHtml(sections.summary)}</div></div>`;
  if (sections.observations.length) {
    html += `<div class="report-section"><div class="report-section-label">KEY OBSERVATIONS</div><div class="report-section-body"><ul>${sections.observations.map(o => `<li>${escapeHtml(o)}</li>`).join('')}</ul></div></div>`;
  }
  html += `<div class="report-section"><div class="report-section-label">CONFIDENCE</div><div class="report-section-body"><span class="confidence-pill ${confClass}">${escapeHtml(sections.confidence)}</span></div></div>`;
  if (sections.followup) {
    html += `<div class="report-section"><div class="report-section-label">SUGGESTED FOLLOW-UP</div><div class="report-section-body">${escapeHtml(sections.followup)}</div></div>`;
  }
  html += '</div>';
  return html;
}

async function sendQuery() {
  const query = queryInput.value.trim();
  if (!query) return;
  if (!currentImageBase64) { alert('Please upload or select an image first.'); return; }
  if (!apiKey) {
    keyNote.classList.add('show');
    alert('Please add a Gemini API key first (see note above the image panel).');
    return;
  }

  addMessage('user', escapeHtml(query));
  queryInput.value = '';
  askBtn.disabled = true;

  // Step 1: classify
  const categoryKey = classifyQuery(query);
  const category = CATEGORIES[categoryKey];
  const badgeHtml = `<span class="category-badge cat-${categoryKey}">${category.label}</span>`;

  const loadingMsg = addMessage('ai', '', true);
  loadingMsg.querySelector('.msg-label').innerHTML = 'SATQUERY AI ' + badgeHtml;

  const compositionLine = currentComposition
    ? `Local pixel-composition analysis (approximate, computed client-side): vegetation ~${currentComposition.veg}%, water ~${currentComposition.water}%, built-up/bare soil ~${currentComposition.built}%. Use this only as rough supporting context, not ground truth.`
    : '';

  const systemContext = `You are SatQuery AI, a vision-language assistant specialized in interpreting remote sensing / satellite imagery for applications like land-use classification, change detection, flood/disaster mapping, and vegetation analysis.
Query category detected: ${category.label}. ${category.promptFocus}
${compositionLine}

Respond in EXACTLY this format, plain text, no markdown symbols:
SUMMARY: <1-2 sentence direct answer to the question>
OBSERVATIONS:
- <specific visual observation 1>
- <specific visual observation 2>
- <specific visual observation 3>
CONFIDENCE: <High, Medium, or Low — your confidence in this answer given image quality/resolution>
FOLLOWUP: <one relevant follow-up question the user could ask next>`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: systemContext + "\n\nUser question: " + query },
              { inline_data: { mime_type: currentImageMime, data: currentImageBase64 } }
            ]
          }]
        })
      }
    );
    const data = await response.json();
    let cardHtml;
    if (data.error) {
      cardHtml = `<div class="report-card"><div class="report-section-body">Error: ${escapeHtml(data.error.message)}</div></div>`;
    } else {
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawText) {
        cardHtml = `<div class="report-card"><div class="report-section-body">No response received — try rephrasing the question.</div></div>`;
      } else {
        const sections = parseStructuredResponse(rawText);
        cardHtml = renderReportCard(sections, categoryKey);
      }
    }
    loadingMsg.querySelector('.msg-bubble').innerHTML = cardHtml;
  } catch (err) {
    loadingMsg.querySelector('.msg-bubble').innerHTML = `<div class="report-card"><div class="report-section-body">Request failed: ${escapeHtml(err.message)} (check API key / network)</div></div>`;
  } finally {
    askBtn.disabled = false;
    chat.scrollTop = chat.scrollHeight;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
