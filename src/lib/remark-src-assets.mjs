// The CMS stores images it uploads as "/src/assets/uploads/<file>". Astro only optimises
// images in Markdown when the path is relative, so rewrite those paths relative to the post.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function walk(node, fn) {
  fn(node);
  if (node.children) for (const c of node.children) walk(c, fn);
}

export default function remarkSrcAssets() {
  return (tree, file) => {
    const from = file?.path ? path.dirname(file.path) : null;
    if (!from) return;
    walk(tree, (node) => {
      if (node.type === 'image' && typeof node.url === 'string' && node.url.startsWith('/src/assets/')) {
        const rel = path.relative(from, path.join(root, node.url));
        node.url = rel.startsWith('.') ? rel : `./${rel}`;
      }
    });
  };
}
