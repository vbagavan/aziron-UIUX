/** Count non-overlapping case-insensitive matches in plain text. */
export function countSearchMatches(text, query) {
  if (!query || !text) return 0;
  const q = query.toLowerCase();
  const lower = text.toLowerCase();
  let count = 0;
  let idx = 0;
  while ((idx = lower.indexOf(q, idx)) !== -1) {
    count += 1;
    idx += q.length;
  }
  return count;
}

/** Count matches across chapter bodies. */
export function countChapterSearchMatches(chapters, query) {
  if (!query?.trim()) return 0;
  return chapters.reduce((sum, ch) => sum + countSearchMatches(ch.body ?? "", query), 0);
}

/**
 * Split text into React-renderable segments with search hit marks.
 * Returns { nodes, hitCount } where hitCount is number of marks added.
 */
export function buildSearchHighlightNodes(text, query, startHitIndex, activeHitIndex) {
  if (!text) return { nodes: [text], hitCount: 0 };
  if (!query?.trim()) return { nodes: [text], hitCount: 0 };

  const q = query.toLowerCase();
  const lower = text.toLowerCase();
  const nodes = [];
  let i = 0;
  let hitIndex = startHitIndex;
  let localHits = 0;

  while (i < text.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      nodes.push(text.slice(i));
      break;
    }
    if (idx > i) nodes.push(text.slice(i, idx));
    const matchText = text.slice(idx, idx + query.length);
    const currentHit = hitIndex;
    nodes.push({
      type: "hit",
      key: `${idx}-${currentHit}`,
      hitIndex: currentHit,
      active: currentHit === activeHitIndex,
      text: matchText,
    });
    hitIndex += 1;
    localHits += 1;
    i = idx + query.length;
  }

  return { nodes, hitCount: localHits };
}
