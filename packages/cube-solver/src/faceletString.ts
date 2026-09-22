import { FaceletStringError } from './errors';
import { at } from '@turnwise/internal';
import type { Face, FaceGrid, FaceStickers } from '@turnwise/internal';

const FACE_ORDER: readonly Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

function toFace(character: string): Face | undefined {
  return FACE_ORDER.find((face) => face === character);
}

function readFace<Centre extends Face>(
  centre: Centre,
  order: number,
  input: string,
): FaceStickers<Centre> {
  const start = order * 9;
  const cells: Face[] = [];
  for (let index = start; index < start + 9; index++) {
    const character = input.charAt(index);
    const face = toFace(character);
    if (face === undefined) {
      throw new FaceletStringError(
        `The character at index ${String(index)} of the facelet string is ${JSON.stringify(character)}. Only the face letters U, R, F, D, L and B are allowed. That character is sticker ${String(index - start)} of face ${centre}.`,
        index,
      );
    }
    cells.push(face);
  }
  if (at(cells, 4) !== centre) {
    throw new FaceletStringError(
      `The centre of face ${centre}, at index ${String(start + 4)} of the facelet string, is "${at(cells, 4)}". A centre always carries its own face's letter, so this string either lists its faces in another order than U, R, F, D, L, B, or describes a cube held in another orientation.`,
      start + 4,
    );
  }
  return [
    at(cells, 0),
    at(cells, 1),
    at(cells, 2),
    at(cells, 3),
    centre,
    at(cells, 5),
    at(cells, 6),
    at(cells, 7),
    at(cells, 8),
  ];
}

/**
 * Reads the 54-character facelet string that other cube programs exchange: nine stickers per
 * face, faces in the order U, R, F, D, L, B, each sticker named by the face it belongs to.
 *
 * Only the format is checked here. Pass the result to `cubeFromFaces` to check the cube itself.
 *
 * @throws {@link FaceletStringError} when the string is not 54 face letters with every centre on
 * its own face.
 */
export function parseFaceletString(input: string): FaceGrid {
  // The type system already guarantees a string. This guards callers writing plain JavaScript.
  const received: unknown = input;
  if (typeof received !== 'string') {
    throw new TypeError(`Expected a facelet string, but received ${typeof received}.`);
  }
  if (input.length !== 54) {
    throw new FaceletStringError(
      `A facelet string has exactly 54 characters, one per sticker. This one has ${String(input.length)}.`,
    );
  }
  return {
    U: readFace('U', 0, input),
    R: readFace('R', 1, input),
    F: readFace('F', 2, input),
    D: readFace('D', 3, input),
    L: readFace('L', 4, input),
    B: readFace('B', 5, input),
  };
}
