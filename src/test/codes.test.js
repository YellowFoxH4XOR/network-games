import { describe, it, expect } from 'vitest';
import { generateCode, generateUniqueCodes, CODE_ALPHABET, CODE_LENGTH } from '../../api/_codes.js';

describe('stall code generation', () => {
  it('produces codes of the configured length from the unambiguous alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateCode();
      expect(code).toHaveLength(CODE_LENGTH);
      for (const ch of code) expect(CODE_ALPHABET).toContain(ch);
    }
  });

  // Codes get read aloud / written on whiteboards at booths — 0/O, 1/I/L are
  // excluded so a misheard character can't lock someone out.
  it('never contains ambiguous characters (0, O, 1, I, L)', () => {
    expect([...'0O1IL'].some((ch) => CODE_ALPHABET.includes(ch))).toBe(false);
  });

  it('gives every stall a distinct code in one batch', () => {
    const codes = generateUniqueCodes(['stall-1', 'stall-2', 'stall-3']);
    expect(Object.keys(codes)).toEqual(['stall-1', 'stall-2', 'stall-3']);
    expect(new Set(Object.values(codes)).size).toBe(3);
  });

  // The public /api/stall lookup escapes ILIKE wildcards — but generated codes
  // must never contain them anyway, or a legitimate code couldn't be entered.
  it('never contains ILIKE metacharacters (%, _)', () => {
    expect(CODE_ALPHABET).not.toMatch(/[%_]/);
  });
});
