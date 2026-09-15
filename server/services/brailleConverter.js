/**
 * services/brailleConverter.js
 * 
 * High-accuracy English text to 6-dot Unicode Braille converter.
 * Converts characters to true Unicode Braille glyphs (range U+2800 to U+283F).
 * 
 * Supported Modes:
 *   1. GRADE 1:
 *      - Full lowercase alphabet (a-z)
 *      - Capital letter indicator (⠠ / U+2820)
 *      - Number indicator (⠼ / U+283C) preceding runs of digits (1-0 mapped to a-j)
 *      - Full set of standard punctuation marks
 *      - Preserves spaces and newlines
 * 
 *   2. GRADE 2 (Supported Subset):
 *      - Clearly-scoped, verified subset of English Grade 2 Braille:
 *        * Whole-word contractions (wordsigns): the, and, for, of, with, but, have, that, not, you, can, people
 *        * Letter-group contractions (groupsigns): ch, sh, th, wh, er, ou, ow, ing, ed, ar
 *      - Note: Full standard Grade 2 Braille contains hundreds of context-dependent
 *        linguistic rules (e.g., prefix/suffix limitations, pronunciation rules)
 *        which are intentionally out of scope for this college project.
 */

// Braille Indicator Glyphs
const CAP_INDICATOR = '\u2820'; // ⠠ (dot 6)
const NUM_INDICATOR = '\u283C'; // ⠼ (dots 3-4-5-6)

// Alphabet mapping: a-z
const ALPHABET_MAP = {
  a: '\u2801', // ⠁ (dot 1)
  b: '\u2803', // ⠃ (dots 1-2)
  c: '\u2809', // ⠉ (dots 1-4)
  d: '\u2819', // ⠙ (dots 1-4-5)
  e: '\u2811', // ⠑ (dots 1-5)
  f: '\u280B', // ⠋ (dots 1-2-4)
  g: '\u281B', // ⠛ (dots 1-2-4-5)
  h: '\u2813', // ⠓ (dots 1-2-5)
  i: '\u280A', // ⠊ (dots 2-4)
  j: '\u281A', // ⠚ (dots 2-4-5)
  k: '\u2805', // ⠅ (dots 1-3)
  l: '\u2807', // ⠇ (dots 1-2-3)
  m: '\u280D', // ⠍ (dots 1-3-4)
  n: '\u281D', // ⠝ (dots 1-3-4-5)
  o: '\u2815', // ⠕ (dots 1-3-5)
  p: '\u280F', // ⠏ (dots 1-2-3-4)
  q: '\u281F', // ⠟ (dots 1-2-3-4-5)
  r: '\u2817', // ⠗ (dots 1-2-3-5)
  s: '\u280E', // ⠎ (dots 2-3-4)
  t: '\u281E', // ⠞ (dots 2-3-4-5)
  u: '\u2825', // ⠥ (dots 1-3-6)
  v: '\u2827', // ⠧ (dots 1-2-3-6)
  w: '\u283A', // ⠺ (dots 2-4-5-6)
  x: '\u282D', // ⠭ (dots 1-3-4-6)
  y: '\u283D', // ⠽ (dots 1-3-4-5-6)
  z: '\u2835'  // ⠵ (dots 1-3-5-6)
};

// Digits mapping: reuse a-j behind the number indicator
const DIGIT_MAP = {
  '1': ALPHABET_MAP.a, // ⠁
  '2': ALPHABET_MAP.b, // ⠃
  '3': ALPHABET_MAP.c, // ⠉
  '4': ALPHABET_MAP.d, // ⠙
  '5': ALPHABET_MAP.e, // ⠑
  '6': ALPHABET_MAP.f, // ⠋
  '7': ALPHABET_MAP.g, // ⠛
  '8': ALPHABET_MAP.h, // ⠓
  '9': ALPHABET_MAP.i, // ⠊
  '0': ALPHABET_MAP.j  // ⠚
};

// Punctuation mapping
const PUNCTUATION_MAP = {
  '.': '\u2832', // ⠲ (dots 2-5-6)
  ',': '\u2802', // ⠂ (dot 2)
  ';': '\u2806', // ⠆ (dots 2-3)
  ':': '\u2812', // ⠒ (dots 2-5)
  '?': '\u2826', // ⠦ (dots 2-3-6)
  '!': '\u2816', // ⠖ (dots 2-3-5)
  "'": '\u2804', // ⠄ (dot 3)
  '-': '\u2824', // ⠤ (dots 3-6)
  '(': '\u2836', // ⠶ (dots 2-3-5-6)
  ')': '\u2836', // ⠶ (dots 2-3-5-6)
  '“': '\u2826', // ⠦ (dots 2-3-6)
  '”': '\u2834', // ⠴ (dots 3-5-6)
  '"': '\u2834', // ⠴ (dots 3-5-6)
  '/': '\u280C', // ⠌ (dots 3-4)
  ' ': ' ',      // Standard space preserved
  '\t': '    ',  // Tab to 4 spaces
  '\n': '\n',    // Newline preserved
  '\r': ''       // Carriage return stripped
};

// Grade 2 Verified Whole-Word Contractions (Wordsigns)
const GRADE2_WORDS = {
  the: '\u282E',    // ⠮ (dots 2-3-4-6)
  and: '\u282F',    // ⠯ (dots 1-2-3-4-6)
  for: '\u283F',    // ⠿ (dots 1-2-3-4-5-6)
  of: '\u2837',     // ⠷ (dots 1-2-3-5-6)
  with: '\u283E',   // ⠾ (dots 2-3-4-5-6)
  but: ALPHABET_MAP.b,   // ⠃ (stand-alone b)
  have: ALPHABET_MAP.h,  // ⠓ (stand-alone h)
  that: ALPHABET_MAP.t,  // ⠞ (stand-alone t)
  not: ALPHABET_MAP.n,   // ⠝ (stand-alone n)
  you: ALPHABET_MAP.y,   // ⠽ (stand-alone y)
  can: ALPHABET_MAP.c,   // ⠉ (stand-alone c)
  people: ALPHABET_MAP.p // ⠏ (stand-alone p)
};

// Grade 2 Verified Letter-Group Contractions (Groupsigns)
// Order from longest to shortest to prevent partial overlapping
const GRADE2_GROUPS = [
  { pattern: 'ing', braille: '\u282C' }, // ⠬ (dots 3-4-6)
  { pattern: 'ch', braille: '\u2821' },  // ⠡ (dots 1-6)
  { pattern: 'sh', braille: '\u2829' },  // ⠩ (dots 1-4-6)
  { pattern: 'th', braille: '\u2839' },  // ⠹ (dots 1-4-5-6)
  { pattern: 'wh', braille: '\u2831' },  // ⠱ (dots 1-5-6)
  { pattern: 'er', braille: '\u283B' },  // ⠻ (dots 1-2-4-5-6)
  { pattern: 'ou', braille: '\u2833' },  // ⠳ (dots 1-2-5-6)
  { pattern: 'ow', braille: '\u282A' },  // ⠪ (dots 2-4-6)
  { pattern: 'ed', braille: '\u282B' },  // ⠫ (dots 1-2-4-6)
  { pattern: 'ar', braille: '\u281C' }   // ⠜ (dots 3-4-5)
];

/**
 * Translates a single word or token according to Grade 1 rules.
 * Handles uppercase letters, digits with number indicator, and punctuation.
 * 
 * @param {string} text - Raw input text
 * @returns {string} Unicode Braille string
 */
function translateGrade1(text) {
  if (!text) return '';

  let braille = '';
  let inNumberMode = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Check if character is a digit
    if (char >= '0' && char <= '9') {
      if (!inNumberMode) {
        braille += NUM_INDICATOR;
        inNumberMode = true;
      }
      braille += DIGIT_MAP[char];
      continue;
    }

    // If we were in number mode and encountered a non-digit, exit number mode
    inNumberMode = false;

    // Check uppercase letter
    if (char >= 'A' && char <= 'Z') {
      braille += CAP_INDICATOR;
      const lowerChar = char.toLowerCase();
      braille += ALPHABET_MAP[lowerChar] || lowerChar;
      continue;
    }

    // Check lowercase letter
    if (char >= 'a' && char <= 'z') {
      braille += ALPHABET_MAP[char];
      continue;
    }

    // Check punctuation and whitespace
    if (PUNCTUATION_MAP[char] !== undefined) {
      braille += PUNCTUATION_MAP[char];
      continue;
    }

    // Fallback for unmapped characters (e.g. unknown symbols): preserve character
    braille += char;
  }

  return braille;
}

/**
 * Translates text according to Grade 2 rules (supported common subset).
 * 
 * Step 1: Tokenize by words, preserving punctuation and whitespace.
 * Step 2: Check for whole-word contractions (case-insensitively).
 *         If matched, apply capital indicator if word was capitalized.
 * Step 3: For words not whole-contracted, apply letter-group contractions.
 * Step 4: Fallback remaining letters, numbers, and punctuation to Grade 1.
 * 
 * @param {string} text - Raw input text
 * @returns {string} Unicode Braille string
 */
function translateGrade2(text) {
  if (!text) return '';

  // Regular expression tokenizing words vs non-word tokens (spaces, punctuation)
  const tokens = text.split(/([a-zA-Z0-9]+)/);
  let result = '';

  for (const token of tokens) {
    if (!token) continue;

    // If token is purely letters, examine Grade 2 contraction rules
    if (/^[a-zA-Z]+$/.test(token)) {
      const lower = token.toLowerCase();
      const isCapitalized = token[0] >= 'A' && token[0] <= 'Z';
      const isAllUpper = token.length > 1 && token === token.toUpperCase();

      // Check Whole-Word Contraction
      if (GRADE2_WORDS[lower]) {
        let wordBraille = GRADE2_WORDS[lower];
        if (isAllUpper) {
          // Double capital sign for all caps in Braille: ⠠⠠
          result += CAP_INDICATOR + CAP_INDICATOR + wordBraille;
        } else if (isCapitalized) {
          result += CAP_INDICATOR + wordBraille;
        } else {
          result += wordBraille;
        }
        continue;
      }

      // Check Letter-Group Contractions within the word
      let wordProcessed = '';
      let idx = 0;

      while (idx < token.length) {
        let matchedGroup = null;

        // Try matching each group sign starting at current index
        for (const grp of GRADE2_GROUPS) {
          const sub = token.substring(idx, idx + grp.pattern.length).toLowerCase();
          if (sub === grp.pattern) {
            matchedGroup = grp;
            break;
          }
        }

        if (matchedGroup) {
          // Check if first letter of group in original token is uppercase
          const isGrpCap = token[idx] >= 'A' && token[idx] <= 'Z';
          if (isGrpCap && idx === 0) {
            wordProcessed += CAP_INDICATOR;
          }
          wordProcessed += matchedGroup.braille;
          idx += matchedGroup.pattern.length;
        } else {
          // Standard Grade 1 character conversion for this single character
          const char = token[idx];
          if (char >= 'A' && char <= 'Z') {
            wordProcessed += CAP_INDICATOR + ALPHABET_MAP[char.toLowerCase()];
          } else if (char >= 'a' && char <= 'z') {
            wordProcessed += ALPHABET_MAP[char];
          } else {
            wordProcessed += char;
          }
          idx++;
        }
      }

      result += wordProcessed;
      continue;
    }

    // If token contains numbers or punctuation, run through Grade 1 translator
    result += translateGrade1(token);
  }

  return result;
}

/**
 * Main Translation Dispatcher
 * @param {string} text - Raw input text
 * @param {'GRADE_1'|'GRADE_2'} grade - Selected Braille grade
 * @returns {string} Resulting Unicode Braille
 */
function convertToBraille(text, grade = 'GRADE_1') {
  if (typeof text !== 'string') return '';

  if (grade === 'GRADE_2') {
    return translateGrade2(text);
  }

  return translateGrade1(text);
}

module.exports = {
  convertToBraille,
  translateGrade1,
  translateGrade2,
  ALPHABET_MAP,
  DIGIT_MAP,
  PUNCTUATION_MAP,
  GRADE2_WORDS,
  GRADE2_GROUPS,
  CAP_INDICATOR,
  NUM_INDICATOR
};
