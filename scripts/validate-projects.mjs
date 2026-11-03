import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('public');
const data = JSON.parse(await readFile(path.join(root, 'data/projects.json'), 'utf8'));
function assert(condition, message) {
  if (!condition) throw new Error('projects.json: ' + message);
}
assert(Array.isArray(data.categories), 'categories must be an array');
assert(Array.isArray(data.projects), 'projects must be an array');
const categoryIds = new Set();
for (const c of data.categories) {
  assert(/^[a-z][a-z0-9-]*$/.test(c.id) && c.id !== 'all', 'invalid category ID');
  assert(!categoryIds.has(c.id), 'duplicate category ID: ' + c.id);
  assert(typeof c.name === 'string' && c.name.trim(), 'category name is required');
  categoryIds.add(c.id);
}
const ids = new Set();
async function asset(src, label) {
  assert(typeof src === 'string' && src.trim(), label + ' is required');
  if (/^https:\/\//.test(src)) return;
  assert(
    src.startsWith('/') &&
      !src.startsWith('//') &&
      !src.includes('..') &&
      !src.includes('?') &&
      !src.includes('#'),
    label + ' must be a local image path or an HTTPS URL'
  );
  assert(
    /\.(svg|png|jpe?g|webp|avif|gif)$/i.test(src),
    label + ' must be an SVG, PNG, JPG, WebP, AVIF, or GIF image'
  );
  try {
    await access(path.join(root, src));
  } catch {
    throw new Error(label + ' not found: ' + src);
  }
}
for (const p of data.projects) {
  assert(/^[a-z][a-z0-9-]*$/.test(p.id), 'invalid project ID');
  assert(!ids.has(p.id), 'duplicate project ID: ' + p.id);
  ids.add(p.id);
  assert(categoryIds.has(p.category), 'category not found for ' + p.id);
  for (const key of ['title', 'subtitle', 'label', 'type', 'intro'])
    assert(typeof p[key] === 'string' && p[key].trim(), p.id + '.' + key + ' is required');
  assert(
    Array.isArray(p.details) && p.details.every((s) => typeof s === 'string'),
    p.id + '.details must be an array of strings'
  );
  assert(
    Array.isArray(p.tags) && p.tags.every((s) => typeof s === 'string'),
    p.id + '.tags must be an array of strings'
  );
  await asset(p.thumbnail, p.id + '.thumbnail');
  assert(
    typeof p.thumbnailAlt === 'string' && p.thumbnailAlt.trim(),
    p.id + '.thumbnailAlt is required'
  );
  if (p.images !== undefined) {
    assert(Array.isArray(p.images), p.id + '.images must be an array');
    for (const image of p.images) {
      await asset(image.src, p.id + '.images.src');
      assert(
        typeof image.alt === 'string' && image.alt.trim(),
        p.id + ' requires alt text for every image'
      );
    }
  }
  if (p.link) assert(/^https:\/\//.test(p.link), p.id + '.link must be an HTTPS URL');
}
console.log(
  `Project data valid: ${data.projects.length} projects, ${data.categories.length} categories.`
);
