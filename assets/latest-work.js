function workKey(link) {
  const url = new URL(link);
  const natureId = url.hostname.replace(/^www\./, '') === 'nature.com'
    ? url.pathname.match(/\bd41586-[a-z0-9-]+\b/i)?.[0]
    : null;
  return natureId?.toLowerCase() || url.origin + url.pathname.replace(/\/$/, '') + url.search;
}

async function loadLatestWork() {
  const list = document.getElementById('latest-work');
  try {
    const response = await fetch('assets/latest-work.json');
    if (!response.ok) return;
    const { items } = await response.json();
    const archiveKeys = new Set(
      Array.from(document.querySelectorAll('#archive-work a[href]'), link => workKey(link.href))
    );
    const rows = items.filter(item => !archiveKeys.has(workKey(item.url))).slice(0, 8).map(item => {
      const row = document.createElement('a');
      row.className = 'feature-row';
      const url = new URL(item.url);
      if (url.protocol !== 'https:') throw new Error('Unexpected link protocol');
      row.href = url.href;
      const meta = document.createElement('span');
      meta.className = 'feature-type';
      const day = new Date(item.date + 'T00:00:00Z');
      meta.textContent = item.kind + ' · ' + day.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
      });
      const title = document.createElement('h3');
      title.textContent = item.title;
      const arrow = document.createElement('span');
      arrow.className = 'feature-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';
      row.append(meta, title, arrow);
      return row;
    });
    if (rows.length) list.replaceChildren(...rows);
  } catch {
    // The homepage still contains a verified link when served offline.
  }
}
loadLatestWork();
