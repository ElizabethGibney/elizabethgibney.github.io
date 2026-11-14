import { readFile, writeFile } from 'node:fs/promises';
import { sections, entriesFor, workRows } from './work-catalogue.mjs';

const root = new URL('../', import.meta.url);
const cache = JSON.parse(await readFile(new URL('assets/latest-work.json', root)));
const manual = JSON.parse(await readFile(new URL('manual-work.json', root)));
const items = [...new Map([...cache.items, ...manual].map(item => [item.url, item])).values()];
for (const section of sections) {
  const nav = sections.map(link => `<a href="${link.file}"${link === section ? ' aria-current="page"' : ''}>${link.label}</a>`).join('\n');
  const page = `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${section.label} | Elizabeth Gibney</title>
<link rel="stylesheet" href="assets/style.css"><link rel="stylesheet" href="assets/work-catalogue.css">
</head><body class="work-catalogue">
<header class="site-head"><div class="shell head-in"><a class="brand" href="index.html">Elizabeth Gibney</a>
<nav class="main-nav" aria-label="Work sections">${nav}</nav></div></header>
<main class="shell catalogue-main"><h1>${section.label}</h1>
<div class="feature-list">${workRows(entriesFor(items, section))}</div></main></body></html>`;
  await writeFile(new URL(section.file, root), page);
}
