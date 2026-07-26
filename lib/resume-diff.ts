import type { TailoredResume } from "@/types/analysis";

// Very small line-based diff between two TailoredResume.full_text values.
// Returns an array of changes { type: 'added'|'removed'|'common', text }
export function diffResumes(
  original: TailoredResume,
  modified: TailoredResume
) {
  const a = (original.full_text || "").split(/\r?\n/);
  const b = (modified.full_text || "").split(/\r?\n/);

  const changes: { type: string; text: string }[] = [];

  // Simple O(n^2) algorithm for small inputs — good enough for resume text.
  let i = 0;
  let j = 0;

  while (i < a.length || j < b.length) {
    const la = a[i];
    const lb = b[j];

    if (la === lb) {
      changes.push({ type: "common", text: la });
      i++;
      j++;
      continue;
    }

    // lookahead: if next lines match, consider this line added/removed
    if (b.slice(j + 1, j + 4).includes(la)) {
      changes.push({ type: "added", text: lb });
      j++;
      continue;
    }

    if (a.slice(i + 1, i + 4).includes(lb)) {
      changes.push({ type: "removed", text: la });
      i++;
      continue;
    }

    // fallback: mark removed then added
    if (la !== undefined) {
      changes.push({ type: "removed", text: la });
      i++;
    }
    if (lb !== undefined) {
      changes.push({ type: "added", text: lb });
      j++;
    }
  }

  return changes;
}
