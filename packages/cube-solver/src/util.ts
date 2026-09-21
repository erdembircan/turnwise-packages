function outOfRange(index: number): never {
  throw new RangeError(`Internal error: index ${String(index)} is out of range.`);
}

// The search and the table builder read typed arrays millions of times. One reader per array type
// keeps every call site to a single shape, which lets the engine inline it; the generic `at` in
// @turnwise/internal costs about three times as much there.

export function read8(table: Uint8Array, index: number): number {
  return table[index] ?? outOfRange(index);
}

export function read16(table: Uint16Array, index: number): number {
  return table[index] ?? outOfRange(index);
}

export function read32(table: Uint32Array, index: number): number {
  return table[index] ?? outOfRange(index);
}
