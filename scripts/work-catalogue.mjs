export const sections = [
  { file: 'writing.html', label: 'Writing', kind: 'Writing', limit: 20 },
  { file: 'nature-video.html', label: 'Video', kind: 'Video' },
  { file: 'nature-podcast.html', label: 'Podcast', kind: 'Podcast' },
  { file: 'bbc-inside-science.html', label: 'BBC Inside Science', kind: 'BBC Inside Science' },
];

export const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function entriesFor(items, section) {
  return items.filter(item => item.kind === section.kind)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, section.limit ?? Infinity);
}

function videoThumbnail(item, url) {
  if (item.kind !== 'Video') return '';
  const host = url.hostname.replace(/^www\./, '');
  const youtubeId = host === 'youtube.com'
    ? url.pathname.match(/^\/shorts\/([A-Za-z0-9_-]{11})\/?$/)?.[1] || url.searchParams.get('v')
    : null;
  const id = youtubeId || item.thumbnailYouTubeId;
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return '';
  return '<img class="video-thumbnail" src="https://i.ytimg.com/vi/' + id +
    '/mqdefault.jpg" width="320" height="180" alt="" loading="lazy" decoding="async" onerror="this.remove()">';
}

export function workRows(items) {
  return items.map(item => {
    const url = new URL(item.url);
    if (url.protocol !== 'https:') throw Error('Work links must use HTTPS');
    const short = url.hostname.replace(/^www\./, '') === 'youtube.com' &&
      /^\/shorts\/[A-Za-z0-9_-]+\/?$/.test(url.pathname);
    const date = item.date ? new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'long', timeZone: 'UTC'
    }).format(new Date(item.date)) : '';
    const details = [short ? 'YouTube Short' : '', date].filter(Boolean).join(' · ');
    const thumbnail = videoThumbnail(item, url);
    return `<a class="feature-row${thumbnail ? ' has-thumbnail' : ''}" href="${escape(url.href)}">${thumbnail}<span class="feature-type">${escape(details)}</span><h3>${escape(item.title)}</h3><span class="feature-arrow" aria-hidden="true">↗</span></a>`;
  }).join('\n');
}
