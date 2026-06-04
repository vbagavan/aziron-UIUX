/** Build and flatten cloud picker items with optional parentId nesting. */

export function buildFileTree(items) {
  const byId = new Map(
    (items ?? []).map((item) => [item.id, { ...item, children: [] }]),
  );
  const roots = [];

  for (const item of items ?? []) {
    const node = byId.get(item.id);
    const parentId = item.parentId ?? null;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => {
      if (node.children.length > 0) sortNodes(node.children);
    });
  };

  sortNodes(roots);
  return roots;
}

export function flattenVisibleTree(nodes, expandedIds, depth = 0) {
  const rows = [];
  for (const node of nodes) {
    rows.push({ node, depth });
    if (node.type === "folder" && expandedIds.has(node.id) && node.children.length > 0) {
      rows.push(...flattenVisibleTree(node.children, expandedIds, depth + 1));
    }
  }
  return rows;
}

export function getFolderIds(items) {
  return (items ?? []).filter((item) => item.type === "folder").map((item) => item.id);
}

export function getSelectableFiles(items) {
  return (items ?? []).filter((item) => item.type === "file");
}

export function filterFilesForSearch(items, query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const byId = new Map((items ?? []).map((item) => [item.id, item]));

  function getPath(item) {
    const parts = [item.name];
    let parentId = item.parentId ?? null;
    while (parentId && byId.has(parentId)) {
      const parent = byId.get(parentId);
      parts.unshift(parent.name);
      parentId = parent.parentId ?? null;
    }
    return parts.join(" / ");
  }

  return (items ?? [])
    .filter((item) => item.type === "file" && item.name.toLowerCase().includes(q))
    .sort((a, b) => getPath(a).localeCompare(getPath(b)))
    .map((node) => ({ node, depth: 0, pathLabel: getPath(node) }));
}
