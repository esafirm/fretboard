// ── Chord Database ────────────────────────────────────────────────────────────
// Format: [string6(low-E), string5(A), string4(D), string3(G), string2(B), string1(high-E)]
// -1 = muted (X), 0 = open, 1-22 = fret number
// barre: { fret, from, to } — optional barre indicator
// fingers: [6,5,4,3,2,1] — 0=open/muted, 1-4=finger number

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_ALT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const CHORD_TYPES = [
  { id: 'major',   name: 'Major',         symbol: '',      formula: '1–3–5',         intervals: [0,4,7] },
  { id: 'minor',   name: 'Minor',         symbol: 'm',     formula: '1–♭3–5',        intervals: [0,3,7] },
  { id: '7',       name: 'Dom. 7th',      symbol: '7',     formula: '1–3–5–♭7',      intervals: [0,4,7,10] },
  { id: 'maj7',    name: 'Major 7th',     symbol: 'maj7',  formula: '1–3–5–7',       intervals: [0,4,7,11] },
  { id: 'm7',      name: 'Minor 7th',     symbol: 'm7',    formula: '1–♭3–5–♭7',     intervals: [0,3,7,10] },
  { id: 'dim',     name: 'Diminished',    symbol: '°',     formula: '1–♭3–♭5',       intervals: [0,3,6] },
  { id: 'dim7',    name: 'Dim. 7th',      symbol: '°7',    formula: '1–♭3–♭5–♭♭7',  intervals: [0,3,6,9] },
  { id: 'aug',     name: 'Augmented',     symbol: '+',     formula: '1–3–♯5',        intervals: [0,4,8] },
  { id: 'sus2',    name: 'Sus 2',         symbol: 'sus2',  formula: '1–2–5',         intervals: [0,2,7] },
  { id: 'sus4',    name: 'Sus 4',         symbol: 'sus4',  formula: '1–4–5',         intervals: [0,5,7] },
  { id: '5',       name: 'Power',         symbol: '5',     formula: '1–5',           intervals: [0,7] },
  { id: 'm7b5',    name: 'Half-Dim.',     symbol: 'ø7',    formula: '1–♭3–♭5–♭7',   intervals: [0,3,6,10] },
  { id: '9',       name: 'Dom. 9th',      symbol: '9',     formula: '1–3–5–♭7–9',   intervals: [0,4,7,10,14] },
  { id: 'maj9',    name: 'Major 9th',     symbol: 'maj9',  formula: '1–3–5–7–9',    intervals: [0,4,7,11,14] },
  { id: 'm9',      name: 'Minor 9th',     symbol: 'm9',    formula: '1–♭3–5–♭7–9',  intervals: [0,3,7,10,14] },
  { id: '6',       name: 'Major 6th',     symbol: '6',     formula: '1–3–5–6',       intervals: [0,4,7,9] },
  { id: 'm6',      name: 'Minor 6th',     symbol: 'm6',    formula: '1–♭3–5–6',      intervals: [0,3,7,9] },
  { id: 'add9',    name: 'Add 9',         symbol: 'add9',  formula: '1–3–5–9',       intervals: [0,4,7,14] },
  { id: '7sus4',   name: '7 Sus 4',       symbol: '7sus4', formula: '1–4–5–♭7',      intervals: [0,5,7,10] },
  { id: '13',      name: 'Dom. 13th',     symbol: '13',    formula: '1–3–♭7–13',     intervals: [0,4,10,21] },
];

// ── Standard tuning: string pitches (semitones, MIDI-relative)
// E2=40, A2=45, D3=50, G3=55, B3=59, E4=64
const TUNINGS = {
  standard: { name: 'Standard', notes: ['E2','A2','D3','G3','B3','E4'], pitches: [40,45,50,55,59,64] },
  dropD:    { name: 'Drop D',   notes: ['D2','A2','D3','G3','B3','E4'], pitches: [38,45,50,55,59,64] },
  openG:    { name: 'Open G',   notes: ['D2','G2','D3','G3','B3','D4'], pitches: [38,43,50,55,59,62] },
  openE:    { name: 'Open E',   notes: ['E2','B2','E3','G#3','B3','E4'], pitches: [40,47,52,56,59,64] },
  dadgad:   { name: 'DADGAD',   notes: ['D2','A2','D3','G3','A3','D4'], pitches: [38,45,50,55,57,62] },
  halfDown: { name: '½ Step Down', notes: ['Eb2','Ab2','Db3','Gb3','Bb3','Eb4'], pitches: [39,44,49,54,58,63] },
};

// ── Chord voicings database ────────────────────────────────────────────────────
// Organized as: CHORD_VOICINGS[rootIndex][typeId] = [ voicing1, voicing2, ... ]
// Each voicing: { frets: [6,5,4,3,2,1], fingers: [6,5,4,3,2,1], barre?, capo? }

const CHORD_VOICINGS = {};

// Helper to build voicings for all 12 roots
function buildVoicings() {
  // Seed voicings for "open" positions (C, A, G, E, D shapes)
  // We'll define shapes and transpose them

  const rawVoicings = {
    // ── C ────────────────────────────────────────────────────────────────
    'C-major': [
      { frets:[-1,3,2,0,1,0], fingers:[0,3,2,0,1,0] },
      { frets:[8,10,10,9,8,8], fingers:[1,3,4,3,1,1], barre:{fret:8,from:0,to:5} },
      { frets:[0,3,2,0,1,3], fingers:[0,3,2,0,1,4] },
    ],
    'C-minor': [
      { frets:[-1,3,5,5,4,3], fingers:[0,1,3,4,2,1], barre:{fret:3,from:0,to:5} },
      { frets:[8,10,10,9,8,8], fingers:[1,3,4,3,1,1], barre:{fret:8,from:0,to:5} },
      { frets:[-1,3,5,5,4,3], fingers:[0,1,3,4,2,1], barre:{fret:3,from:1,to:5} },
    ],
    'C-7': [
      { frets:[-1,3,2,3,1,0], fingers:[0,3,2,4,1,0] },
      { frets:[8,10,8,9,8,8], fingers:[1,3,1,2,1,1], barre:{fret:8,from:0,to:5} },
    ],
    'C-maj7': [
      { frets:[-1,3,2,0,0,0], fingers:[0,3,2,0,0,0] },
      { frets:[8,10,9,9,8,8], fingers:[1,4,2,3,1,1], barre:{fret:8,from:0,to:5} },
    ],
    'C-m7': [
      { frets:[-1,3,5,3,4,3], fingers:[0,1,3,1,2,1], barre:{fret:3,from:0,to:5} },
      { frets:[-1,3,5,5,4,3], fingers:[0,1,3,4,2,1], barre:{fret:3,from:1,to:5} },
    ],
    'C-sus2': [
      { frets:[-1,3,0,0,1,3], fingers:[0,2,0,0,1,3] },
      { frets:[8,10,10,10,8,8], fingers:[1,3,3,3,1,1], barre:{fret:8,from:0,to:5} },
    ],
    'C-sus4': [
      { frets:[-1,3,3,0,1,1], fingers:[0,3,4,0,1,2] },
      { frets:[8,10,10,10,8,8], fingers:[1,3,4,4,1,1], barre:{fret:8,from:0,to:5} },
    ],
    'C-dim': [
      { frets:[-1,3,4,5,4,3], fingers:[0,1,2,4,3,1] },
      { frets:[-1,3,4,2,4,2], fingers:[0,2,3,1,4,1] },
    ],
    'C-dim7': [
      { frets:[-1,3,4,2,4,3], fingers:[0,2,3,1,4,2] },
      { frets:[-1,3,1,2,1,0], fingers:[0,4,1,3,2,0] },
    ],
    'C-aug': [
      { frets:[-1,3,2,1,1,0], fingers:[0,4,3,1,2,0] },
      { frets:[-1,3,6,5,5,4], fingers:[0,1,4,2,3,1] },
    ],
    'C-5': [
      { frets:[8,10,10,-1,-1,-1], fingers:[1,3,4,0,0,0] },
      { frets:[-1,3,5,-1,-1,-1], fingers:[0,1,3,0,0,0] },
    ],
    'C-m7b5': [
      { frets:[-1,3,4,3,4,3], fingers:[0,1,2,1,3,1], barre:{fret:3,from:0,to:5} },
      { frets:[-1,3,4,5,4,6], fingers:[0,1,2,3,2,4] },
    ],
    'C-9': [
      { frets:[-1,3,2,3,3,3], fingers:[0,2,1,3,3,3] },
      { frets:[8,10,8,9,8,10], fingers:[1,3,1,2,1,4], barre:{fret:8,from:0,to:5} },
    ],
    'C-maj9': [
      { frets:[-1,3,0,0,0,0], fingers:[0,2,0,0,0,0] },
      { frets:[-1,3,0,0,0,2], fingers:[0,2,0,0,0,1] },
    ],
    'C-add9': [
      { frets:[-1,3,2,0,3,0], fingers:[0,2,1,0,3,0] },
      { frets:[8,10,10,9,8,10], fingers:[1,3,4,2,1,4], barre:{fret:8,from:0,to:5} },
    ],
    'C-6': [
      { frets:[-1,3,2,2,1,0], fingers:[0,3,2,2,1,0] },
      { frets:[8,10,10,9,10,8], fingers:[1,3,4,2,4,1], barre:{fret:8,from:0,to:5} },
    ],
    'C-m6': [
      { frets:[-1,3,5,5,4,5], fingers:[0,1,3,4,2,4] },
      { frets:[8,10,10,8,9,8], fingers:[1,3,4,1,2,1], barre:{fret:8,from:0,to:5} },
    ],
    'C-7sus4': [
      { frets:[-1,3,3,3,1,1], fingers:[0,3,4,3,1,2] },
      { frets:[8,10,8,10,8,8], fingers:[1,3,1,4,1,1], barre:{fret:8,from:0,to:5} },
    ],

    // ── A ─────────────────────────────────────────────────────────────────
    'A-major': [
      { frets:[-1,0,2,2,2,0], fingers:[0,0,1,2,3,0] },
      { frets:[5,7,7,6,5,5], fingers:[1,3,4,2,1,1], barre:{fret:5,from:0,to:5} },
      { frets:[-1,0,2,2,2,5], fingers:[0,0,1,1,1,4] },
    ],
    'A-minor': [
      { frets:[-1,0,2,2,1,0], fingers:[0,0,2,3,1,0] },
      { frets:[5,7,7,5,5,5], fingers:[1,3,4,1,1,1], barre:{fret:5,from:0,to:5} },
    ],
    'A-7': [
      { frets:[-1,0,2,0,2,0], fingers:[0,0,2,0,3,0] },
      { frets:[5,7,5,6,5,5], fingers:[1,3,1,2,1,1], barre:{fret:5,from:0,to:5} },
    ],
    'A-maj7': [
      { frets:[-1,0,2,1,2,0], fingers:[0,0,3,1,2,0] },
    ],
    'A-m7': [
      { frets:[-1,0,2,0,1,0], fingers:[0,0,2,0,1,0] },
      { frets:[5,7,5,5,5,5], fingers:[1,3,1,1,1,1], barre:{fret:5,from:0,to:5} },
    ],
    'A-sus2': [
      { frets:[-1,0,2,2,0,0], fingers:[0,0,1,2,0,0] },
      { frets:[5,7,7,7,5,5], fingers:[1,3,4,4,1,1], barre:{fret:5,from:0,to:5} },
    ],
    'A-sus4': [
      { frets:[-1,0,2,2,3,0], fingers:[0,0,1,2,3,0] },
      { frets:[5,7,7,7,5,5], fingers:[1,3,4,4,1,1], barre:{fret:5,from:0,to:5} },
    ],
    'A-dim': [
      { frets:[-1,0,1,2,1,0], fingers:[0,0,1,3,2,0] },
      { frets:[-1,0,1,2,4,2], fingers:[0,0,1,2,4,3] },
    ],
    'A-dim7': [
      { frets:[-1,0,1,2,1,2], fingers:[0,0,1,3,2,4] },
      { frets:[-1,0,4,2,4,2], fingers:[0,0,4,1,3,2] },
    ],
    'A-aug': [
      { frets:[-1,0,3,2,2,1], fingers:[0,0,4,2,3,1] },
      { frets:[5,7,6,5,5,-1], fingers:[1,4,3,1,2,0] },
    ],
    'A-5': [
      { frets:[-1,0,2,-1,-1,-1], fingers:[0,0,1,0,0,0] },
      { frets:[5,7,7,-1,-1,-1], fingers:[1,3,4,0,0,0] },
    ],
    'A-9': [
      { frets:[-1,0,2,0,2,2], fingers:[0,0,1,0,2,3] },
      { frets:[5,7,5,6,5,7], fingers:[1,3,1,2,1,4], barre:{fret:5,from:0,to:5} },
    ],
    'A-maj9': [
      { frets:[-1,0,2,1,0,0], fingers:[0,0,3,1,0,0] },
      { frets:[5,7,6,6,5,5], fingers:[1,4,2,3,1,1], barre:{fret:5,from:0,to:5} },
    ],
    'A-m9': [
      { frets:[-1,0,2,0,1,0], fingers:[0,0,2,0,1,0] },
      { frets:[5,7,5,5,5,7], fingers:[1,3,1,1,1,4], barre:{fret:5,from:0,to:5} },
    ],
    'A-add9': [
      { frets:[-1,0,2,2,0,2], fingers:[0,0,1,2,0,3] },
      { frets:[5,7,7,6,5,7], fingers:[1,3,4,2,1,4], barre:{fret:5,from:0,to:5} },
    ],
    'A-6': [
      { frets:[-1,0,2,2,2,2], fingers:[0,0,1,2,3,4] },
      { frets:[5,7,7,6,7,5], fingers:[1,3,4,2,4,1], barre:{fret:5,from:0,to:5} },
    ],
    'A-m6': [
      { frets:[-1,0,2,2,1,2], fingers:[0,0,2,3,1,4] },
      { frets:[5,7,7,5,6,5], fingers:[1,3,4,1,2,1], barre:{fret:5,from:0,to:5} },
    ],
    'A-m7b5': [
      { frets:[-1,0,1,2,1,3], fingers:[0,0,1,2,1,4] },
      { frets:[5,6,7,5,7,5], fingers:[1,2,3,1,4,1], barre:{fret:5,from:0,to:5} },
    ],
    'A-7sus4': [
      { frets:[-1,0,2,0,3,0], fingers:[0,0,1,0,2,0] },
      { frets:[5,7,5,7,5,5], fingers:[1,3,1,4,1,1], barre:{fret:5,from:0,to:5} },
    ],

    // ── G ─────────────────────────────────────────────────────────────────
    'G-major': [
      { frets:[3,2,0,0,0,3], fingers:[2,1,0,0,0,3] },
      { frets:[3,2,0,0,3,3], fingers:[2,1,0,0,3,4] },
      { frets:[3,5,5,4,3,3], fingers:[1,3,4,2,1,1], barre:{fret:3,from:0,to:5} },
    ],
    'G-minor': [
      { frets:[3,5,5,3,3,3], fingers:[1,3,4,1,1,1], barre:{fret:3,from:0,to:5} },
      { frets:[-1,-1,5,3,3,3], fingers:[0,0,4,1,1,1], barre:{fret:3,from:2,to:5} },
    ],
    'G-7': [
      { frets:[3,2,0,0,0,1], fingers:[3,2,0,0,0,1] },
      { frets:[3,5,3,4,3,3], fingers:[1,3,1,2,1,1], barre:{fret:3,from:0,to:5} },
    ],
    'G-maj7': [
      { frets:[3,2,0,0,0,2], fingers:[3,2,0,0,0,1] },
    ],
    'G-m7': [
      { frets:[3,5,3,3,3,3], fingers:[1,3,1,1,1,1], barre:{fret:3,from:0,to:5} },
    ],
    'G-sus2': [
      { frets:[3,0,0,0,3,3], fingers:[2,0,0,0,3,4] },
    ],
    'G-sus4': [
      { frets:[3,3,0,0,1,3], fingers:[2,3,0,0,1,4] },
    ],
    'G-dim': [
      { frets:[3,4,5,3,-1,-1], fingers:[1,2,3,1,0,0] },
      { frets:[3,1,2,0,-1,-1], fingers:[3,1,2,0,0,0] },
    ],
    'G-dim7': [
      { frets:[3,4,2,3,-1,-1], fingers:[2,3,1,4,0,0] },
      { frets:[3,1,2,3,-1,-1], fingers:[2,1,1,4,0,0] },
    ],
    'G-aug': [
      { frets:[3,2,1,0,0,-1], fingers:[4,3,1,0,0,0] },
      { frets:[3,2,5,4,4,-1], fingers:[1,0,4,2,3,0] },
    ],
    'G-5': [
      { frets:[3,5,5,-1,-1,-1], fingers:[1,3,4,0,0,0] },
    ],
    'G-9': [
      { frets:[3,0,0,0,0,1], fingers:[3,0,0,0,0,1] },
      { frets:[3,5,3,4,3,5], fingers:[1,3,1,2,1,4], barre:{fret:3,from:0,to:5} },
    ],
    'G-maj9': [
      { frets:[3,2,0,0,0,2], fingers:[2,1,0,0,0,1] },
    ],
    'G-m9': [
      { frets:[3,5,3,3,3,5], fingers:[1,3,1,1,1,4], barre:{fret:3,from:0,to:5} },
    ],
    'G-add9': [
      { frets:[3,2,0,2,3,3], fingers:[2,1,0,1,3,4] },
    ],
    'G-6': [
      { frets:[3,2,0,0,0,0], fingers:[3,2,0,0,0,0] },
      { frets:[3,5,5,4,5,3], fingers:[1,3,4,2,4,1], barre:{fret:3,from:0,to:5} },
    ],
    'G-m6': [
      { frets:[3,5,5,3,4,3], fingers:[1,3,4,1,2,1] },
      { frets:[3,1,2,0,4,3], fingers:[3,1,2,0,4,3] },
    ],
    'G-7sus4': [
      { frets:[3,3,0,0,1,1], fingers:[2,3,0,0,1,1] },
      { frets:[3,5,3,5,3,3], fingers:[1,3,1,4,1,1], barre:{fret:3,from:0,to:5} },
    ],
    'G-m7b5': [
      { frets:[3,4,5,3,4,3], fingers:[1,2,3,1,2,1], barre:{fret:3,from:0,to:5} },
    ],
    'G-13': [
      { frets:[3,5,3,4,5,3], fingers:[1,3,1,2,4,1], barre:{fret:3,from:0,to:5} },
    ],

    // ── E ─────────────────────────────────────────────────────────────────
    'E-major': [
      { frets:[0,2,2,1,0,0], fingers:[0,2,3,1,0,0] },
      { frets:[0,2,2,1,0,0], fingers:[0,2,3,1,0,0] },
      { frets:[12,14,14,13,12,12], fingers:[1,3,4,2,1,1], barre:{fret:12,from:0,to:5} },
    ],
    'E-minor': [
      { frets:[0,2,2,0,0,0], fingers:[0,2,3,0,0,0] },
      { frets:[12,14,14,12,12,12], fingers:[1,3,4,1,1,1], barre:{fret:12,from:0,to:5} },
    ],
    'E-7': [
      { frets:[0,2,0,1,0,0], fingers:[0,2,0,1,0,0] },
    ],
    'E-maj7': [
      { frets:[0,2,1,1,0,0], fingers:[0,3,1,2,0,0] },
    ],
    'E-m7': [
      { frets:[0,2,2,0,3,0], fingers:[0,2,3,0,4,0] },
      { frets:[0,2,0,0,0,0], fingers:[0,2,0,0,0,0] },
    ],
    'E-sus2': [
      { frets:[0,2,2,4,0,0], fingers:[0,1,2,4,0,0] },
      { frets:[12,14,14,16,12,12], fingers:[1,3,4,4,1,1], barre:{fret:12,from:0,to:5} },
    ],
    'E-sus4': [
      { frets:[0,2,2,2,0,0], fingers:[0,2,3,4,0,0] },
      { frets:[12,14,14,14,12,12], fingers:[1,3,4,4,1,1], barre:{fret:12,from:0,to:5} },
    ],
    'E-dim': [
      { frets:[0,1,2,0,-1,-1], fingers:[0,1,2,0,0,0] },
      { frets:[3,4,5,3,-1,-1], fingers:[1,2,3,1,0,0] },
    ],
    'E-aug': [
      { frets:[0,3,2,1,1,0], fingers:[0,4,3,1,2,0] },
      { frets:[4,3,2,1,1,0], fingers:[4,3,2,1,1,0] },
    ],
    'E-5': [
      { frets:[0,2,2,-1,-1,-1], fingers:[0,1,2,0,0,0] },
      { frets:[12,14,14,-1,-1,-1], fingers:[1,3,4,0,0,0] },
    ],
    'E-9': [
      { frets:[0,2,0,1,0,2], fingers:[0,2,0,1,0,3] },
      { frets:[12,14,12,13,12,14], fingers:[1,3,1,2,1,4], barre:{fret:12,from:0,to:5} },
    ],
    'E-maj9': [
      { frets:[0,2,1,1,0,2], fingers:[0,3,1,2,0,4] },
    ],
    'E-m9': [
      { frets:[0,2,0,0,0,2], fingers:[0,2,0,0,0,3] },
    ],
    'E-add9': [
      { frets:[0,2,2,1,0,2], fingers:[0,2,3,1,0,4] },
      { frets:[12,14,14,13,12,14], fingers:[1,3,4,2,1,4], barre:{fret:12,from:0,to:5} },
    ],
    'E-6': [
      { frets:[0,2,2,1,2,0], fingers:[0,2,3,1,4,0] },
      { frets:[12,14,14,13,14,12], fingers:[1,3,4,2,4,1], barre:{fret:12,from:0,to:5} },
    ],
    'E-m6': [
      { frets:[0,2,2,0,2,0], fingers:[0,2,3,0,4,0] },
      { frets:[12,14,14,12,13,12], fingers:[1,3,4,1,2,1], barre:{fret:12,from:0,to:5} },
    ],
    'E-7sus4': [
      { frets:[0,2,2,2,0,0], fingers:[0,1,2,3,0,0] },
      { frets:[12,14,12,14,12,12], fingers:[1,3,1,4,1,1], barre:{fret:12,from:0,to:5} },
    ],
    'E-dim7': [
      { frets:[0,1,2,0,2,0], fingers:[0,1,3,0,4,0] },
      { frets:[3,4,2,3,-1,-1], fingers:[2,3,1,4,0,0] },
    ],
    'E-m7b5': [
      { frets:[0,1,2,0,3,0], fingers:[0,1,2,0,4,0] },
      { frets:[12,13,14,12,14,12], fingers:[1,2,3,1,4,1], barre:{fret:12,from:0,to:5} },
    ],
    'E-13': [
      { frets:[0,2,0,1,2,0], fingers:[0,2,0,1,3,0] },
    ],

    // ── D ─────────────────────────────────────────────────────────────────
    'D-major': [
      { frets:[-1,-1,0,2,3,2], fingers:[0,0,0,1,3,2] },
      { frets:[10,12,12,11,10,10], fingers:[1,3,4,2,1,1], barre:{fret:10,from:0,to:5} },
    ],
    'D-minor': [
      { frets:[-1,-1,0,2,3,1], fingers:[0,0,0,2,3,1] },
      { frets:[10,12,12,10,10,10], fingers:[1,3,4,1,1,1], barre:{fret:10,from:0,to:5} },
    ],
    'D-7': [
      { frets:[-1,-1,0,2,1,2], fingers:[0,0,0,2,1,3] },
    ],
    'D-maj7': [
      { frets:[-1,-1,0,2,2,2], fingers:[0,0,0,1,2,3] },
    ],
    'D-m7': [
      { frets:[-1,-1,0,2,1,1], fingers:[0,0,0,3,1,1], barre:{fret:1,from:3,to:5} },
    ],
    'D-sus2': [
      { frets:[-1,-1,0,2,3,0], fingers:[0,0,0,1,2,0] },
      { frets:[10,12,12,12,10,10], fingers:[1,3,4,4,1,1], barre:{fret:10,from:0,to:5} },
    ],
    'D-sus4': [
      { frets:[-1,-1,0,2,3,3], fingers:[0,0,0,1,3,4] },
      { frets:[10,12,12,12,10,10], fingers:[1,3,4,4,1,1], barre:{fret:10,from:0,to:5} },
    ],
    'D-dim': [
      { frets:[-1,-1,0,1,3,1], fingers:[0,0,0,1,3,2] },
      { frets:[-1,-1,0,4,3,1], fingers:[0,0,0,4,3,1] },
    ],
    'D-dim7': [
      { frets:[-1,-1,0,1,0,1], fingers:[0,0,0,2,0,3] },
      { frets:[-1,-1,0,4,3,4], fingers:[0,0,0,2,1,3] },
    ],
    'D-aug': [
      { frets:[-1,-1,0,3,3,2], fingers:[0,0,0,3,4,2] },
      { frets:[-1,-1,3,2,2,1], fingers:[0,0,4,2,3,1] },
    ],
    'D-5': [
      { frets:[-1,-1,0,2,-1,-1], fingers:[0,0,0,1,0,0] },
      { frets:[10,12,12,-1,-1,-1], fingers:[1,3,4,0,0,0] },
    ],
    'D-9': [
      { frets:[-1,0,0,2,1,2], fingers:[0,0,0,3,1,4] },
      { frets:[10,12,10,11,10,12], fingers:[1,3,1,2,1,4], barre:{fret:10,from:0,to:5} },
    ],
    'D-maj9': [
      { frets:[-1,-1,0,2,2,4], fingers:[0,0,0,1,2,4] },
      { frets:[10,12,11,11,10,12], fingers:[1,4,2,3,1,4], barre:{fret:10,from:0,to:5} },
    ],
    'D-add9': [
      { frets:[-1,0,0,2,3,2], fingers:[0,0,0,1,2,1] },
      { frets:[10,12,12,11,10,12], fingers:[1,3,4,2,1,4], barre:{fret:10,from:0,to:5} },
    ],
    'D-6': [
      { frets:[-1,-1,0,2,0,2], fingers:[0,0,0,2,0,3] },
      { frets:[10,12,12,11,12,10], fingers:[1,3,4,2,4,1], barre:{fret:10,from:0,to:5} },
    ],
    'D-m6': [
      { frets:[-1,-1,0,2,0,1], fingers:[0,0,0,3,0,1] },
      { frets:[10,12,12,10,11,10], fingers:[1,3,4,1,2,1], barre:{fret:10,from:0,to:5} },
    ],
    'D-m7b5': [
      { frets:[-1,-1,0,1,3,1], fingers:[0,0,0,1,4,2] },
      { frets:[10,11,12,10,12,10], fingers:[1,2,3,1,4,1], barre:{fret:10,from:0,to:5} },
    ],
    'D-7sus4': [
      { frets:[-1,-1,0,2,1,3], fingers:[0,0,0,2,1,3] },
      { frets:[10,12,10,12,10,10], fingers:[1,3,1,4,1,1], barre:{fret:10,from:0,to:5} },
    ],
    'm9-D': [
      { frets:[-1,-1,0,2,1,0], fingers:[0,0,0,3,2,0] },
    ],
    '13-D': [
      { frets:[-1,-1,0,2,0,0], fingers:[0,0,0,1,0,0] },
    ],
  };

  // Initialize all 12 root notes with all chord types
  for (let r = 0; r < 12; r++) {
    CHORD_VOICINGS[r] = {};
    for (const type of CHORD_TYPES) {
      CHORD_VOICINGS[r][type.id] = [];
    }
  }

  // Place raw voicings and generate transpositions
  const noteToIndex = { 'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,
                         'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11 };

  for (const [key, voicings] of Object.entries(rawVoicings)) {
    // Parse key: "C-major" or "major-C" or "m9-D"
    let root, typeId;
    const parts = key.split('-');
    if (parts.length === 2) {
      if (noteToIndex[parts[0]] !== undefined) {
        root = parts[0]; typeId = parts[1];
      } else {
        typeId = parts[0]; root = parts[1];
      }
    }
    const rootIdx = noteToIndex[root];
    if (rootIdx === undefined || !CHORD_VOICINGS[rootIdx]) continue;
    const arr = CHORD_VOICINGS[rootIdx][typeId];
    if (!arr) continue;
    arr.push(...voicings);
  }

  // Generate barre transpositions from E-shape and A-shape
  // E shape voicings → transpose up for all roots
  const eShapes = {
    'major': { frets:[0,2,2,1,0,0], fingers:[0,2,3,1,0,0] },
    'minor': { frets:[0,2,2,0,0,0], fingers:[0,2,3,0,0,0] },
    '7':     { frets:[0,2,0,1,0,0], fingers:[0,2,0,1,0,0] },
    'maj7':  { frets:[0,2,1,1,0,0], fingers:[0,3,1,2,0,0] },
    'm7':    { frets:[0,2,0,0,0,0], fingers:[0,2,0,0,0,0] },
    'sus4':  { frets:[0,2,2,2,0,0], fingers:[0,2,3,4,0,0] },
    'sus2':  { frets:[0,2,2,4,0,0], fingers:[0,1,2,4,0,0] },
    'aug':   { frets:[0,3,2,1,1,0], fingers:[0,4,3,1,2,0] },
    'dim':   { frets:[0,1,2,0,-1,-1], fingers:[0,1,2,0,0,0] },
    '5':     { frets:[0,2,2,-1,-1,-1], fingers:[0,1,2,0,0,0] },
    'm7b5':  { frets:[0,1,2,0,3,0], fingers:[0,1,2,0,4,0] },
    '7sus4': { frets:[0,2,2,2,0,0], fingers:[0,1,2,3,0,0] },
    'dim7':  { frets:[0,1,2,0,2,0], fingers:[0,1,3,0,4,0] },
    '9':     { frets:[0,2,0,1,0,2], fingers:[0,2,0,1,0,3] },
    'maj9':  { frets:[0,2,1,1,0,2], fingers:[0,3,1,2,0,4] },
    'm9':    { frets:[0,2,0,0,0,2], fingers:[0,2,0,0,0,3] },
    '6':     { frets:[0,2,2,1,2,0], fingers:[0,2,3,1,4,0] },
    'm6':    { frets:[0,2,2,0,2,0], fingers:[0,2,3,0,4,0] },
    'add9':  { frets:[0,2,2,1,0,2], fingers:[0,2,3,1,0,4] },
    '13':    { frets:[0,2,0,1,2,0], fingers:[0,2,0,1,3,0] },
  };

  // A shape voicings → transpose for all roots
  const aShapes = {
    'major': { frets:[-1,0,2,2,2,0], fingers:[0,0,1,2,3,0] },
    'minor': { frets:[-1,0,2,2,1,0], fingers:[0,0,2,3,1,0] },
    '7':     { frets:[-1,0,2,0,2,0], fingers:[0,0,2,0,3,0] },
    'maj7':  { frets:[-1,0,2,1,2,0], fingers:[0,0,3,1,2,0] },
    'm7':    { frets:[-1,0,2,0,1,0], fingers:[0,0,2,0,1,0] },
    'sus4':  { frets:[-1,0,2,2,3,0], fingers:[0,0,1,2,3,0] },
    'sus2':  { frets:[-1,0,2,2,0,0], fingers:[0,0,1,2,0,0] },
    '5':     { frets:[-1,0,2,-1,-1,-1], fingers:[0,0,1,0,0,0] },
    '7sus4': { frets:[-1,0,2,0,3,0], fingers:[0,0,1,0,2,0] },
    'aug':   { frets:[-1,0,3,2,2,1], fingers:[0,0,4,2,3,1] },
    'dim':   { frets:[-1,0,1,2,1,0], fingers:[0,0,1,3,2,0] },
    'dim7':  { frets:[-1,0,1,2,1,2], fingers:[0,0,1,3,2,4] },
    'm7b5':  { frets:[-1,0,1,2,1,3], fingers:[0,0,1,2,1,4] },
    '9':     { frets:[-1,0,2,0,2,2], fingers:[0,0,1,0,2,3] },
    'maj9':  { frets:[-1,0,2,1,0,0], fingers:[0,0,3,1,0,0] },
    'm9':    { frets:[-1,0,2,0,1,0], fingers:[0,0,2,0,1,0] },
    '6':     { frets:[-1,0,2,2,2,2], fingers:[0,0,1,2,3,4] },
    'm6':    { frets:[-1,0,2,2,1,2], fingers:[0,0,2,3,1,4] },
    'add9':  { frets:[-1,0,2,2,0,2], fingers:[0,0,1,2,0,3] },
    '13':    { frets:[-1,0,2,0,2,0], fingers:[0,0,1,0,2,0] },
  };

  const OPEN_PITCHES = [40,45,50,55,59,64]; // E A D G B E

  function transposeVoicing(shape, semitones) {
    const frets = shape.frets.map(f => f < 0 ? f : f + semitones);
    const fingers = [...shape.fingers];
    const result = { frets, fingers };
    if (shape.barre) {
      result.barre = { fret: shape.barre.fret + semitones, from: shape.barre.from, to: shape.barre.to };
    }
    return result;
  }

  // E shape root note is on string 6 (index 0), pitch 40 = E2
  // A shape root note is on string 5 (index 1), pitch 45 = A2
  for (const [typeId, shape] of Object.entries(eShapes)) {
    for (let r = 0; r < 12; r++) {
      const targetPitch = 40 + r; // E=0, F=1, F#=2...
      // Lowest sensible fret
      const semitones = ((targetPitch - 40) % 12 + 12) % 12;
      if (semitones === 0) continue; // already have E-shape open
      const v = transposeVoicing(shape, semitones);
      if (!v.barre) {
        v.barre = { fret: semitones, from: 0, to: 5 };
      }
      // Add fingers = 1 for barre on lowest fret, shift others
      v.fingers = v.fingers.map(f => f > 0 ? Math.min(f+1,4) : f);
      // String 0 and string 5: barre finger = 1
      v.fingers[0] = 1; v.fingers[4] = 1; v.fingers[5] = 1;
      if (!CHORD_VOICINGS[r][typeId]) continue;
      // Avoid dupes
      const existing = CHORD_VOICINGS[r][typeId];
      const key2 = v.frets.join(',');
      if (!existing.some(e => e.frets.join(',') === key2)) {
        existing.push(v);
      }
    }
  }

  for (const [typeId, shape] of Object.entries(aShapes)) {
    for (let r = 0; r < 12; r++) {
      const targetPitch = 45 + r;
      const semitones = ((targetPitch - 45) % 12 + 12) % 12;
      if (semitones === 0) continue;
      const v = transposeVoicing(shape, semitones);
      if (!v.barre) {
        v.barre = { fret: semitones, from: 1, to: 5 };
      }
      v.fingers = v.fingers.map(f => f > 0 ? Math.min(f+1,4) : f);
      v.fingers[1] = 1; v.fingers[5] = 1;
      if (!CHORD_VOICINGS[r][typeId]) continue;
      const existing = CHORD_VOICINGS[r][typeId];
      const key2 = v.frets.join(',');
      if (!existing.some(e => e.frets.join(',') === key2)) {
        existing.push(v);
      }
    }
  }

  // Fill any empty with generic fallback
  for (let r = 0; r < 12; r++) {
    for (const type of CHORD_TYPES) {
      if (!CHORD_VOICINGS[r][type.id] || CHORD_VOICINGS[r][type.id].length === 0) {
        // Generic barre
        const semitones = r;
        const baseFret = semitones === 0 ? 12 : semitones;
        CHORD_VOICINGS[r][type.id] = [{
          frets: [baseFret, baseFret+2, baseFret+2, baseFret+1, baseFret, baseFret],
          fingers: [1,3,4,2,1,1],
          barre: { fret: baseFret, from: 0, to: 5 }
        }];
      }
    }
  }
}

buildVoicings();

// Export
window.NOTES = NOTES;
window.NOTE_ALT = NOTE_ALT;
window.CHORD_TYPES = CHORD_TYPES;
window.CHORD_VOICINGS = CHORD_VOICINGS;
window.TUNINGS = TUNINGS;
