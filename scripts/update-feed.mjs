import { readFile, writeFile, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const data = new URL('../assets/latest-work.json', import.meta.url);
const manualFile = new URL('../manual-work.json', import.meta.url);
const stripMarkup = text => text.replace(/<[^>]*>/g, '').trim();

export function writingItem(work) {
  const doi = work.DOI || '';
  const id = doi.toLowerCase().match(/^10\.1038\/(d41586-[\da-z-]+)$/)?.[1];
  const credited = work.author?.some(author =>
    author.given?.trim().toLowerCase() === 'elizabeth' &&
    author.family?.trim().toLowerCase() === 'gibney');
  const dateParts = (work['published-online'] || work.published)?.['date-parts']?.[0];
  const title = stripMarkup(work.title?.[0] || '');
  if (!id || !credited || dateParts?.length !== 3 || !title ||
      /podcast|briefing chat/i.test(title)) return null;
  const date = dateParts.map(n => String(n).padStart(2, '0')).join('-');
  return { kind: 'Writing', date, title, url: 'https://www.nature.com/articles/' + id };
}

function itemKey(item) {
  const url = new URL(item.url);
  if (url.protocol !== 'https:') throw new Error('Use HTTPS links only');
  return url.origin + url.pathname.replace(/\/$/, '');
}

export async function update(fetchSource = fetch) {
  const previous = JSON.parse(await readFile(data, 'utf8'));
  const manual = JSON.parse(await readFile(manualFile, 'utf8'));
  const params = new URLSearchParams({
    'query.author': 'Elizabeth Gibney',
    filter: 'prefix:10.1038',
    sort: 'published',
    order: 'desc',
    rows: '100',
    select: 'DOI,title,author,published,published-online',
  });
  let recent = [];
  let sourceError;
  try {
    const response = await fetchSource('https://api.crossref.org/works?' + params, {
      signal: AbortSignal.timeout(20000),
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Crossref returned HTTP ' + response.status);
    recent = (await response.json()).message.items.map(writingItem).filter(Boolean);
    if (!recent.length) throw new Error('Crossref returned no matching bylines');
  } catch (error) {
    sourceError = error;
  }

  const writing = previous.items.filter(item => item.kind === 'Writing');
  const indexed = new Map([...writing, ...recent, ...manual].map(item => [itemKey(item), item]));
  const items = [...indexed.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50);
  const json = JSON.stringify({ items }, null, 2) + '\n';
  if (json !== JSON.stringify(previous, null, 2) + '\n') {
    const temp = fileURLToPath(data) + '.' + randomUUID() + '.tmp';
    await writeFile(temp, json);
    await rename(temp, data);
  }
  if (sourceError) throw sourceError;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await update().catch(error => {
    console.error('Kept previously saved writing:', error.message);
    process.exitCode = 1;
  });
}
