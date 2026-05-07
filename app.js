// ── App State ─────────────────────────────────────────────────────────────────
const state = {
  rootIndex: 2,       // D
  typeId: '7',
  voicingIndex: 0,
  tuning: 'standard',
  position: 0,
  showAllPositions: false,
};

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
let audioCtx = null;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildNoteGrid();
  buildTypeList();
  buildTuningPanel();
  updateUI();
  checkOnline();
  window.addEventListener('online', checkOnline);
  window.addEventListener('offline', checkOnline);

  $('playBtn').addEventListener('click', playChord);
  $('toggleTuning').addEventListener('click', openTuning);
  $('closeTuning').addEventListener('click', closeTuning);
  $('overlay').addEventListener('click', closeTuning);
  $('showAllBtn').addEventListener('click', () => {
    state.showAllPositions = !state.showAllPositions;
    $('showAllBtn').classList.toggle('active', state.showAllPositions);
    updateUI();
  });

  // keyboard shortcut
  document.addEventListener('keydown', e => {
    if (e.key === ' ') { e.preventDefault(); playChord(); }
  });
});

function checkOnline() {
  const badge = $('offlineBadge');
  if (navigator.onLine) {
    badge.classList.add('online');
    badge.classList.remove('offline');
    badge.innerHTML = '<span class="dot"></span><span>Online</span>';
  } else {
    badge.classList.add('offline');
    badge.classList.remove('online');
    badge.innerHTML = '<span class="dot"></span><span>Offline</span>';
  }
}

// ── Build sidebar ─────────────────────────────────────────────────────────────
function buildNoteGrid() {
  const grid = $('noteGrid');
  grid.innerHTML = '';
  NOTES.forEach((note, i) => {
    const btn = document.createElement('button');
    btn.className = 'note-btn' + (i === state.rootIndex ? ' active' : '');
    btn.textContent = note;
    btn.dataset.index = i;
    btn.addEventListener('click', () => {
      state.rootIndex = i;
      state.voicingIndex = 0;
      state.position = 0;
      document.querySelectorAll('.note-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateUI();
    });
    grid.appendChild(btn);
  });
}

function buildTypeList() {
  const list = $('typeList');
  list.innerHTML = '';
  CHORD_TYPES.forEach(type => {
    const btn = document.createElement('button');
    btn.className = 'type-btn' + (type.id === state.typeId ? ' active' : '');
    btn.dataset.id = type.id;
    btn.innerHTML = `<span>${type.name}</span><span class="type-symbol">${type.symbol || 'M'}</span>`;
    btn.addEventListener('click', () => {
      state.typeId = type.id;
      state.voicingIndex = 0;
      state.position = 0;
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateUI();
    });
    list.appendChild(btn);
  });
}

function buildTuningPanel() {
  const opts = $('tuningOptions');
  opts.innerHTML = '';
  for (const [id, t] of Object.entries(TUNINGS)) {
    const btn = document.createElement('div');
    btn.className = 'tuning-option' + (id === state.tuning ? ' active' : '');
    btn.dataset.id = id;
    btn.innerHTML = `<span class="tuning-name">${t.name}</span><span class="tuning-notes">${t.notes.join(' ')}</span>`;
    btn.addEventListener('click', () => {
      state.tuning = id;
      document.querySelectorAll('.tuning-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateUI();
      closeTuning();
    });
    opts.appendChild(btn);
  }
}

// ── Tuning panel ──────────────────────────────────────────────────────────────
function openTuning() {
  $('tuningPanel').classList.add('show');
  $('overlay').classList.add('show');
}
function closeTuning() {
  $('tuningPanel').classList.remove('show');
  $('overlay').classList.remove('show');
}

// ── Main update ───────────────────────────────────────────────────────────────
function updateUI() {
  const note = NOTES[state.rootIndex];
  const type = CHORD_TYPES.find(t => t.id === state.typeId);
  const voicings = CHORD_VOICINGS[state.rootIndex][state.typeId] || [];

  // Header
  $('chordName').textContent = note + (type.symbol || '');
  $('chordFullName').textContent = note + ' ' + type.name;
  $('chordSymbol').textContent = type.symbol || 'M';
  $('chordFormula').textContent = type.formula;

  // Compute actual chord notes
  const tuning = TUNINGS[state.tuning];
  const chordNoteNames = getChordNoteNames(state.rootIndex, type.intervals);
  $('chordNotes').textContent = chordNoteNames.join(' ');

  // Voicing selector
  buildVoicingSelector(voicings);

  // Position dots (alternate voicings)
  buildPositionDots(voicings);

  // Main fretboard
  const voicing = voicings[state.voicingIndex] || voicings[0];
  if (voicing) {
    drawFretboard(voicing, tuning);
  }

  // Diagram grid
  buildDiagramGrid(voicings, tuning);

  // Notes pills
  buildNotesPills(chordNoteNames, note);
}

function getChordNoteNames(rootIdx, intervals) {
  return intervals.map(i => {
    const idx = (rootIdx + i) % 12;
    return NOTES[idx];
  });
}

// ── Voicing selector ──────────────────────────────────────────────────────────
function buildVoicingSelector(voicings) {
  const sel = $('voicingSelector');
  sel.innerHTML = '';
  voicings.slice(0, 6).forEach((v, i) => {
    const btn = document.createElement('button');
    btn.className = 'voicing-btn' + (i === state.voicingIndex ? ' active' : '');
    const minFret = Math.min(...v.frets.filter(f => f > 0));
    btn.textContent = `Voicing ${i+1}  (pos. ${minFret})`;
    btn.addEventListener('click', () => {
      state.voicingIndex = i;
      state.position = i;
      updateUI();
    });
    sel.appendChild(btn);
  });
}

function buildPositionDots(voicings) {
  const dots = $('positionDots');
  dots.innerHTML = '';
  const list = state.showAllPositions ? voicings : voicings.slice(0, 9);
  list.forEach((v, i) => {
    const d = document.createElement('div');
    d.className = 'pos-dot' + (i === state.voicingIndex ? ' active' : '');
    d.textContent = i+1;
    d.addEventListener('click', () => {
      state.voicingIndex = i;
      state.position = i;
      updateUI();
    });
    dots.appendChild(d);
  });
}

// ── Fretboard canvas ──────────────────────────────────────────────────────────
function drawFretboard(voicing, tuning) {
  const canvas = $('fretboard');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const STRINGS = 6;
  const FRETS_SHOWN = 16;
  const padLeft = 72;
  const padRight = 20;
  const padTop = 28;
  const padBottom = 20;
  const fretW = (W - padLeft - padRight) / FRETS_SHOWN;
  const stringH = (H - padTop - padBottom) / (STRINGS - 1);

  // Find the display window
  const activeFrets = voicing.frets.filter(f => f > 0);
  const minFret = activeFrets.length > 0 ? Math.min(...activeFrets) : 1;
  const startFret = minFret > 1 ? minFret - 1 : 1;

  // Background
  ctx.fillStyle = '#1a1410';
  ctx.fillRect(0, 0, W, H);

  // Fret numbers
  ctx.fillStyle = '#555';
  ctx.font = '11px DM Mono, monospace';
  ctx.textAlign = 'center';
  for (let f = 0; f <= FRETS_SHOWN; f++) {
    const x = padLeft + f * fretW;
    ctx.fillText(startFret + f, x, 16);
  }

  // String labels
  const stringNames = tuning.notes.slice().reverse();
  ctx.font = '11px DM Mono, monospace';
  ctx.textAlign = 'right';
  [0,1,2,3,4,5].forEach(s => {
    const y = padTop + s * stringH;
    ctx.fillStyle = '#888';
    ctx.fillText(stringNames[s].replace(/\d/,''), padLeft - 28, y + 4);
  });

  // Fret markers on fretboard
  const markerFrets = [3,5,7,9,12,15];
  markerFrets.forEach(mf => {
    const relF = mf - startFret;
    if (relF >= 0 && relF <= FRETS_SHOWN) {
      const x = padLeft + (relF - 0.5) * fretW;
      ctx.fillStyle = '#2a2010';
      if (mf === 12) {
        ctx.beginPath();
        ctx.arc(x, padTop + stringH * 1.5, 5, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, padTop + stringH * 3.5, 5, 0, Math.PI*2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x, padTop + stringH * 2.5, 5, 0, Math.PI*2);
        ctx.fill();
      }
    }
  });

  // Nut
  if (startFret === 0) {
    ctx.fillStyle = '#c8b870';
    ctx.fillRect(padLeft - 4, padTop - 4, 6, (STRINGS-1)*stringH + 8);
  }

  // Fret lines
  for (let f = 0; f <= FRETS_SHOWN; f++) {
    const x = padLeft + f * fretW;
    ctx.strokeStyle = f === 0 ? '#3a3020' : '#2e2010';
    ctx.lineWidth = f === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x, padTop - 4);
    ctx.lineTo(x, padTop + (STRINGS-1)*stringH + 4);
    ctx.stroke();
  }

  // String thicknesses (high E=thin, low E=thick)
  const stringWidths = [2.2, 1.8, 1.4, 1.1, 0.9, 0.7];
  const stringColors = ['#d8c878','#c8b868','#b8a858','#a89848','#988838','#888828'];

  // Draw strings
  for (let s = 0; s < STRINGS; s++) {
    const y = padTop + s * stringH;
    ctx.strokeStyle = stringColors[s];
    ctx.lineWidth = stringWidths[s];
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(padLeft + FRETS_SHOWN * fretW, y);
    ctx.stroke();
  }

  // Barre indicator
  if (voicing.barre) {
    const bf = voicing.barre.fret - startFret;
    if (bf >= 0 && bf <= FRETS_SHOWN) {
      const x = padLeft + (bf - 0.5) * fretW;
      const y1 = padTop + voicing.barre.from * stringH;
      const y2 = padTop + voicing.barre.to * stringH;
      ctx.strokeStyle = 'rgba(232,160,32,0.5)';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();
      ctx.lineCap = 'butt';
    }
  }

  // Finger dots
  // voicing.frets order: [string6(low-E), string5, string4, string3, string2, string1(high-E)]
  const displayOrder = [5,4,3,2,1,0]; // canvas top=high-E(string1), bottom=low-E(string6)
  voicing.frets.forEach((fret, strIdx) => {
    // strIdx 0 = low E (bottom), strIdx 5 = high E (top)
    const canvasRow = 5 - strIdx; // flip: strIdx 0 → row 5 (bottom)
    const y = padTop + canvasRow * stringH;
    const x_str = padLeft - 16;

    if (fret === -1) {
      // Muted
      ctx.fillStyle = '#cc4444';
      ctx.font = 'bold 13px DM Sans';
      ctx.textAlign = 'center';
      ctx.fillText('✕', padLeft - 16, y + 4);
    } else if (fret === 0) {
      // Open
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(padLeft - 16, y, 6, 0, Math.PI*2);
      ctx.stroke();
    } else {
      // Fretted note
      const relF = fret - startFret;
      if (relF >= 0 && relF <= FRETS_SHOWN) {
        const x = padLeft + (relF - 0.5) * fretW;
        const finger = voicing.fingers ? voicing.fingers[strIdx] : 0;
        const isRoot = (fret > 0) && isRootNote(strIdx, fret, tuning);

        // Glow
        ctx.shadowBlur = isRoot ? 12 : 6;
        ctx.shadowColor = isRoot ? '#e8a020' : 'rgba(232,160,32,0.4)';

        ctx.fillStyle = isRoot ? '#e8a020' : '#e0d0a0';
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI*2);
        ctx.fill();

        ctx.shadowBlur = 0;

        if (finger > 0) {
          ctx.fillStyle = isRoot ? '#000' : '#1a1410';
          ctx.font = 'bold 11px DM Sans';
          ctx.textAlign = 'center';
          ctx.fillText(finger, x, y + 4);
        }
      }
    }
  });
}

function isRootNote(strIdx, fret, tuning) {
  const pitch = tuning.pitches[strIdx] + fret;
  return (pitch % 12) === (state.rootIndex % 12);
}

// ── Mini diagram canvas ───────────────────────────────────────────────────────
function drawMiniDiagram(canvas, voicing, isActive) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  const STRINGS = 6;
  const FRETS = 5;
  const padL = 14, padR = 8, padT = 20, padB = 10;
  const fw = (W - padL - padR) / FRETS;
  const sh = (H - padT - padB) / (STRINGS-1);

  const activeFrets = voicing.frets.filter(f => f > 0);
  const minFret = activeFrets.length > 0 ? Math.min(...activeFrets) : 1;
  const startFret = minFret > 1 ? minFret - 1 : 1;

  // bg
  ctx.fillStyle = '#161410';
  ctx.fillRect(0,0,W,H);

  // Position marker
  if (startFret > 0) {
    ctx.fillStyle = '#666';
    ctx.font = '8px DM Mono';
    ctx.textAlign = 'left';
    ctx.fillText(startFret+'fr', 2, 12);
  }

  // Nut
  if (startFret === 0) {
    ctx.fillStyle = '#c8b870';
    ctx.fillRect(padL-2, padT-2, 3, (STRINGS-1)*sh + 4);
  }

  // Fret lines
  for (let f = 0; f <= FRETS; f++) {
    const x = padL + f * fw;
    ctx.strokeStyle = '#2e2010';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, padT + (STRINGS-1)*sh);
    ctx.stroke();
  }

  // Strings
  const strW = [1.8,1.4,1.1,0.9,0.7,0.6];
  for (let s = 0; s < STRINGS; s++) {
    const y = padT + s * sh;
    ctx.strokeStyle = '#887828';
    ctx.lineWidth = strW[s];
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + FRETS * fw, y);
    ctx.stroke();
  }

  // Dots
  voicing.frets.forEach((fret, strIdx) => {
    const row = 5 - strIdx;
    const y = padT + row * sh;
    if (fret === -1) {
      ctx.fillStyle = '#cc4444';
      ctx.font = '7px DM Sans';
      ctx.textAlign = 'center';
      ctx.fillText('✕', padL - 7, y + 3);
    } else if (fret === 0) {
      ctx.strokeStyle = '#bbb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(padL - 7, y, 3, 0, Math.PI*2);
      ctx.stroke();
    } else {
      const relF = fret - startFret;
      if (relF >= 0 && relF <= FRETS) {
        const x = padL + (relF - 0.5) * fw;
        const isRoot = (TUNINGS[state.tuning].pitches[strIdx] + fret) % 12 === state.rootIndex % 12;
        ctx.fillStyle = isRoot ? '#e8a020' : '#c0b080';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI*2);
        ctx.fill();
      }
    }
  });
}

// ── Diagram grid ──────────────────────────────────────────────────────────────
function buildDiagramGrid(voicings, tuning) {
  const grid = $('diagramGrid');
  grid.innerHTML = '';

  const display = state.showAllPositions ? voicings : voicings.slice(0, 9);
  display.forEach((v, i) => {
    const card = document.createElement('div');
    card.className = 'chord-diagram' + (i === state.voicingIndex ? ' active' : '');

    const wrap = document.createElement('div');
    wrap.className = 'diagram-canvas-wrap';
    const cvs = document.createElement('canvas');
    cvs.width = 104; cvs.height = 90;
    cvs.style.width = '100%';
    wrap.appendChild(cvs);
    card.appendChild(wrap);

    const label = document.createElement('div');
    label.className = 'diagram-label';
    const minF = Math.min(...v.frets.filter(f=>f>0));
    label.textContent = `pos. ${minF}`;
    card.appendChild(label);

    card.addEventListener('click', () => {
      state.voicingIndex = i;
      state.position = i;
      updateUI();
    });
    grid.appendChild(card);

    // Draw after append
    requestAnimationFrame(() => drawMiniDiagram(cvs, v, i === state.voicingIndex));
  });
}

// ── Notes pills ───────────────────────────────────────────────────────────────
function buildNotesPills(noteNames, root) {
  const ref = $('notesReference');
  ref.innerHTML = '';
  noteNames.forEach(n => {
    const pill = document.createElement('span');
    pill.className = 'note-pill' + (n === root ? ' root' : '');
    pill.textContent = n;
    ref.appendChild(pill);
  });
}

// ── Audio ─────────────────────────────────────────────────────────────────────
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function noteFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function playChord() {
  const voicings = CHORD_VOICINGS[state.rootIndex][state.typeId] || [];
  const voicing = voicings[state.voicingIndex] || voicings[0];
  if (!voicing) return;

  const actx = getAudioCtx();
  const tuning = TUNINGS[state.tuning];
  const now = actx.currentTime;

  voicing.frets.forEach((fret, strIdx) => {
    if (fret < 0) return;
    const midi = tuning.pitches[strIdx] + fret;
    const freq = noteFreq(midi);
    const delay = strIdx * 0.045; // strum effect

    const osc = actx.createOscillator();
    const gainNode = actx.createGain();
    const filter = actx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + delay);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now + delay);
    filter.Q.setValueAtTime(2, now + delay);

    gainNode.gain.setValueAtTime(0, now + delay);
    gainNode.gain.linearRampToValueAtTime(0.18, now + delay + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 2.2);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(actx.destination);

    osc.start(now + delay);
    osc.stop(now + delay + 2.5);
  });

  // Flash play button
  const btn = $('playBtn');
  btn.style.transform = 'scale(0.9)';
  setTimeout(() => btn.style.transform = '', 150);
}
