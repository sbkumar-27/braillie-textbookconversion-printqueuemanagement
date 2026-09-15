/**
 * tests/brailleConverter.test.js
 * 
 * Comprehensive test suite validating Unicode Braille output against exact codepoint specifications.
 */

const {
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
} = require('../services/brailleConverter');

describe('Braille Converter Engine Tests', () => {

  describe('Grade 1: Alphabet & Word Translation', () => {
    test('translates individual lowercase letters accurately', () => {
      expect(convertToBraille('a', 'GRADE_1')).toBe('⠁');
      expect(convertToBraille('b', 'GRADE_1')).toBe('⠃');
      expect(convertToBraille('c', 'GRADE_1')).toBe('⠉');
      expect(convertToBraille('k', 'GRADE_1')).toBe('⠅');
      expect(convertToBraille('m', 'GRADE_1')).toBe('⠍');
      expect(convertToBraille('z', 'GRADE_1')).toBe('⠵');
    });

    test('translates complete lowercase word without spaces', () => {
      // hello: h (⠓), e (⠑), l (⠇), l (⠇), o (⠕)
      expect(convertToBraille('hello', 'GRADE_1')).toBe('⠓⠑⠇⠇⠕');
      // braille: b (⠃), r (⠗), a (⠁), i (⠊), l (⠇), l (⠇), e (⠑)
      expect(convertToBraille('braille', 'GRADE_1')).toBe('⠃⠗⠁⠊⠇⠇⠑');
    });

    test('handles single capital letter indicator', () => {
      // 'A' should have dot-6 capital indicator ⠠ followed by ⠁
      expect(convertToBraille('A', 'GRADE_1')).toBe('⠠⠁');
      // 'Hello' -> ⠠⠓⠑⠇⠇⠕
      expect(convertToBraille('Hello', 'GRADE_1')).toBe('⠠⠓⠑⠇⠇⠕');
    });
  });

  describe('Grade 1: Numbers & Digit Sequences', () => {
    test('translates single digits using number indicator and a-j cells', () => {
      // 1 -> ⠼⠁
      expect(convertToBraille('1', 'GRADE_1')).toBe('⠼⠁');
      // 5 -> ⠼⠑
      expect(convertToBraille('5', 'GRADE_1')).toBe('⠼⠑');
      // 0 -> ⠼⠚
      expect(convertToBraille('0', 'GRADE_1')).toBe('⠼⠚');
    });

    test('groups consecutive digits behind a SINGLE number sign', () => {
      // 42 -> ⠼ + ⠙ + ⠃ = ⠼⠙⠃
      expect(convertToBraille('42', 'GRADE_1')).toBe('⠼⠙⠃');
      // 123 -> ⠼ + ⠁ + ⠃ + ⠉ = ⠼⠁⠃⠉
      expect(convertToBraille('123', 'GRADE_1')).toBe('⠼⠁⠃⠉');
      // 2026 -> ⠼ + ⠃ + ⠚ + ⠃ + ⠋ = ⠼⠃⠚⠃⠋
      expect(convertToBraille('2026', 'GRADE_1')).toBe('⠼⠃⠚⠃⠋');
    });

    test('handles mixed letters and numbers with proper indicator reset', () => {
      // Room 101 -> ⠠⠗⠕⠕⠍ ⠼⠁⠚⠁
      expect(convertToBraille('Room 101', 'GRADE_1')).toBe('⠠⠗⠕⠕⠍ ⠼⠁⠚⠁');
    });
  });

  describe('Grade 1: Punctuation, Spaces, and Newlines', () => {
    test('translates standard punctuation correctly', () => {
      expect(convertToBraille('.', 'GRADE_1')).toBe('⠲');
      expect(convertToBraille(',', 'GRADE_1')).toBe('⠂');
      expect(convertToBraille(';', 'GRADE_1')).toBe('⠆');
      expect(convertToBraille(':', 'GRADE_1')).toBe('⠒');
      expect(convertToBraille('?', 'GRADE_1')).toBe('⠦');
      expect(convertToBraille('!', 'GRADE_1')).toBe('⠖');
      expect(convertToBraille("'", 'GRADE_1')).toBe('⠄');
      expect(convertToBraille('-', 'GRADE_1')).toBe('⠤');
      expect(convertToBraille('()', 'GRADE_1')).toBe('⠶⠶');
    });

    test('preserves whitespace and line breaks', () => {
      const input = 'hello world\nline two';
      const expected = '⠓⠑⠇⠇⠕ ⠺⠕⠗⠇⠙\n⠇⠊⠝⠑ ⠞⠺⠕';
      expect(convertToBraille(input, 'GRADE_1')).toBe(expected);
    });

    test('translates a full sentence in Grade 1', () => {
      // "The cat sat." in Grade 1
      // The: ⠠⠞⠓⠑
      // cat: ⠉⠁⠞
      // sat: ⠎⠁⠞
      // .: ⠲
      expect(convertToBraille('The cat sat.', 'GRADE_1')).toBe('⠠⠞⠓⠑ ⠉⠁⠞ ⠎⠁⠞⠲');
    });
  });

  describe('Grade 2 (Supported Subset): Whole-Word Contractions', () => {
    test('translates standalone whole-word contractions', () => {
      expect(convertToBraille('the', 'GRADE_2')).toBe('⠮');
      expect(convertToBraille('and', 'GRADE_2')).toBe('⠯');
      expect(convertToBraille('for', 'GRADE_2')).toBe('⠿');
      expect(convertToBraille('of', 'GRADE_2')).toBe('⠷');
      expect(convertToBraille('with', 'GRADE_2')).toBe('⠾');
      expect(convertToBraille('but', 'GRADE_2')).toBe('⠃');
      expect(convertToBraille('have', 'GRADE_2')).toBe('⠓');
      expect(convertToBraille('that', 'GRADE_2')).toBe('⠞');
      expect(convertToBraille('not', 'GRADE_2')).toBe('⠝');
      expect(convertToBraille('you', 'GRADE_2')).toBe('⠽');
      expect(convertToBraille('can', 'GRADE_2')).toBe('⠉');
      expect(convertToBraille('people', 'GRADE_2')).toBe('⠏');
    });

    test('applies capital indicator to whole-word contractions', () => {
      expect(convertToBraille('The', 'GRADE_2')).toBe('⠠⠮');
      expect(convertToBraille('And', 'GRADE_2')).toBe('⠠⠯');
      expect(convertToBraille('With', 'GRADE_2')).toBe('⠠⠾');
    });

    test('does NOT contract whole words when they form part of a larger word', () => {
      // "then" should NOT replace "the" with the single word sign ⠮
      // It should instead contract the groupsign "th" (⠹) + "e" (⠑) + "n" (⠝)
      expect(convertToBraille('then', 'GRADE_2')).toBe('⠹⠑⠝');
    });
  });

  describe('Grade 2 (Supported Subset): Letter-Group Contractions', () => {
    test('translates groupsign "ch" (⠡)', () => {
      // "child" -> ⠡ (ch) + ⠊ (i) + ⠇ (l) + ⠙ (d) = ⠡⠊⠇⠙
      expect(convertToBraille('child', 'GRADE_2')).toBe('⠡⠊⠇⠙');
    });

    test('translates groupsign "sh" (⠩)', () => {
      // "ship" -> ⠩ (sh) + ⠊ (i) + ⠏ (p) = ⠩⠊⠏
      expect(convertToBraille('ship', 'GRADE_2')).toBe('⠩⠊⠏');
    });

    test('translates groupsign "th" (⠹)', () => {
      // "this" -> ⠹ (th) + ⠊ (i) + ⠎ (s) = ⠹⠊⠎
      expect(convertToBraille('this', 'GRADE_2')).toBe('⠹⠊⠎');
    });

    test('translates groupsign "wh" (⠱)', () => {
      // "when" -> ⠱ (wh) + ⠑ (e) + ⠝ (n) = ⠱⠑⠝
      expect(convertToBraille('when', 'GRADE_2')).toBe('⠱⠑⠝');
    });

    test('translates groupsign "er" (⠻)', () => {
      // "her" -> ⠓ (h) + ⠻ (er) = ⠓⠻
      expect(convertToBraille('her', 'GRADE_2')).toBe('⠓⠻');
    });

    test('translates groupsign "ou" (⠳)', () => {
      // "out" -> ⠳ (ou) + ⠞ (t) = ⠳⠞
      expect(convertToBraille('out', 'GRADE_2')).toBe('⠳⠞');
    });

    test('translates groupsign "ow" (⠪)', () => {
      // "show" -> ⠩ (sh) + ⠪ (ow) = ⠩⠪
      expect(convertToBraille('show', 'GRADE_2')).toBe('⠩⠪');
    });

    test('translates groupsign "ing" (⠬)', () => {
      // "sing" -> ⠎ (s) + ⠬ (ing) = ⠎⠬
      expect(convertToBraille('sing', 'GRADE_2')).toBe('⠎⠬');
    });

    test('translates groupsign "ed" (⠫)', () => {
      // "red" -> ⠗ (r) + ⠫ (ed) = ⠗⠫
      expect(convertToBraille('red', 'GRADE_2')).toBe('⠗⠫');
    });

    test('translates groupsign "ar" (⠜)', () => {
      // "park" -> ⠏ (p) + ⠜ (ar) + ⠅ (k) = ⠏⠜⠅
      expect(convertToBraille('park', 'GRADE_2')).toBe('⠏⠜⠅');
    });
  });

  describe('Full Sentence Translations & Grade Comparison', () => {
    test('compares Grade 1 vs Grade 2 contraction efficiency', () => {
      const sentence = 'The book is for you.';

      const grade1 = convertToBraille(sentence, 'GRADE_1');
      const grade2 = convertToBraille(sentence, 'GRADE_2');

      // Grade 1 spells out each word
      expect(grade1).toBe('⠠⠞⠓⠑ ⠃⠕⠕⠅ ⠊⠎ ⠋⠕⠗ ⠽⠕⠥⠲');

      // Grade 2 uses wordsigns: The -> ⠠⠮, for -> ⠿, you -> ⠽
      expect(grade2).toBe('⠠⠮ ⠃⠕⠕⠅ ⠊⠎ ⠿ ⠽⠲');

      // Grade 2 must be shorter in character count than Grade 1
      expect(grade2.length).toBeLessThan(grade1.length);
    });
  });

});
