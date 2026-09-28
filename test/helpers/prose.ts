/**
 * Collapses runs of whitespace to a single space so a phrase that wraps
 * across lines still matches as one span.
 */
export function flatten(text: string): string {
  return text.replace(/\s+/g, ' ');
}
