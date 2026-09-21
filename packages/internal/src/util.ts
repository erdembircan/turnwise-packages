/**
 * Reads `values[index]`, throwing instead of returning `undefined`. Every table it reads is sized so
 * the throw never happens; it exists because the compiler cannot know that.
 */
export function at<T>(values: ArrayLike<T>, index: number): T {
  const value = values[index];
  if (value === undefined) {
    throw new RangeError(`Internal error: index ${String(index)} is out of range.`);
  }
  return value;
}
