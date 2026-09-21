/**
 * One of the six faces of a 3×3 cube: Up, Right, Front, Down, Left, Back.
 *
 * A face letter is also the value of a sticker. A sticker "is" the face whose centre shares its
 * colour, which keeps every input independent of any particular colour scheme.
 */
export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

/**
 * Every {@link Face}, keyed by itself, for callers who prefer `Faces.U` to the literal `'U'`.
 * Both spellings are the same value and the same type.
 */
export const Faces: { readonly [K in Face]: K } = {
  U: 'U',
  R: 'R',
  F: 'F',
  D: 'D',
  L: 'L',
  B: 'B',
};
