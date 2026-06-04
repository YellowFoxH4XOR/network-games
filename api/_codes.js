// Stall-code generation for the admin "shuffle codes" action. The leading
// underscore keeps Vercel from exposing this as a route; it's import-only.
import { randomInt } from 'node:crypto';

// Unambiguous alphabet — no 0/O, 1/I/L — because codes get read aloud and
// written on whiteboards at the booths.
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 6;

export function generateCode() {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

// One fresh code per slug, guaranteed distinct within the batch. (Collisions at
// 31^6 ≈ 887M are already vanishingly unlikely; the loop is belt-and-braces.)
export function generateUniqueCodes(slugs) {
  const used = new Set();
  const out = {};
  for (const slug of slugs) {
    let code;
    do { code = generateCode(); } while (used.has(code));
    used.add(code);
    out[slug] = code;
  }
  return out;
}
