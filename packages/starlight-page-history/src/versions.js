// /<page>/history/versions.json: every version of a page, for comparing any
// two in the browser. A block that several versions share is stored once.
import { getCollection } from 'astro:content';
import { packVersions } from './diff.js';
import { historyOf, pageSlug } from './pages.js';

export async function getStaticPaths() {
  const entries = await getCollection('docs');
  return entries.filter((entry) => historyOf(entry)).map((entry) => ({ params: { slug: pageSlug(entry.id) || undefined }, props: { entry } }));
}

export function GET({ props }) {
  return new Response(JSON.stringify(packVersions(historyOf(props.entry).versions)), {
    headers: { 'Content-Type': 'application/json' },
  });
}
