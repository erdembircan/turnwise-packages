/**
 * Reads `values[index]`, throwing instead of returning `undefined`. Every internal table in this
 * package is sized so the throw never happens; this exists because the compiler cannot know that.
 */
export function at<T>(values: ArrayLike<T>, index: number): T {
  const value = values[index];
  if (value === undefined) {
    throw new RangeError(`Internal error: index ${String(index)} is out of range.`);
  }
  return value;
}

function outOfRange(index: number): never {
  throw new RangeError(`Internal error: index ${String(index)} is out of range.`);
}

// The search and the table builder read typed arrays millions of times. One reader per array type
// keeps every call site to a single shape, which lets the engine inline it; the generic `at` above
// costs about three times as much there.

export function read8(table: Uint8Array, index: number): number {
  return table[index] ?? outOfRange(index);
}

export function read16(table: Uint16Array, index: number): number {
  return table[index] ?? outOfRange(index);
}

export function read32(table: Uint32Array, index: number): number {
  return table[index] ?? outOfRange(index);
}
