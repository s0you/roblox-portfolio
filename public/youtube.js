// Share URL validation between the page and the project-data checks.
export function youtubeId(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return '';
    const host = url.hostname;
    const parts = url.pathname.split('/').filter(Boolean);
    let id = '';
    if (host === 'youtu.be' && parts.length === 1) {
      id = parts[0];
    } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
      else if (parts.length === 2 && ['embed', 'shorts', 'live'].includes(parts[0]))
        id = parts[1];
    } else if (
      ['youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host) &&
      parts.length === 2 && parts[0] === 'embed'
    ) {
      id = parts[1];
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : '';
  } catch {
    return '';
  }
}
