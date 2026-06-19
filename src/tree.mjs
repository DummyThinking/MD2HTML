export const buildTree = (pages) => {
  const root = [];
  const child = (nodes, name, dir) => {
    let node = nodes.find((n) => n.name === name && n.dir === dir);
    if (!node) { node = { name, dir, children: [] }; nodes.push(node); }
    return node;
  };
  for (const { key, title } of pages) {
    const parts = key.split('/');
    let cursor = root;
    parts.forEach((part, i) => {
      const leaf = i === parts.length - 1;
      const node = child(cursor, leaf ? title : part, !leaf);
      if (leaf) node.key = key;
      else cursor = node.children;
    });
  }
  const sort = (nodes) => {
    nodes.sort((a, b) => (a.dir !== b.dir ? (a.dir ? -1 : 1) : a.name.localeCompare(b.name)));
    nodes.forEach((n) => n.dir && sort(n.children));
  };
  sort(root);
  return root;
};
