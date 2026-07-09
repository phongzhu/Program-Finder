const OFFICIAL_BULACAN_NEWS_CATEGORY_ID = 3;
const OFFICIAL_BULACAN_NEWS_LIMIT = 4;
const FACEBOOK_PLUGIN_WIDTH = 500;
const FACEBOOK_PLUGIN_HEIGHT = 560;

export const OFFICIAL_BULACAN_NEWS_ENDPOINT = `https://bulacan.gov.ph/wp-json/wp/v2/posts?per_page=${OFFICIAL_BULACAN_NEWS_LIMIT}&categories=${OFFICIAL_BULACAN_NEWS_CATEGORY_ID}&_embed`;

export const OFFICIAL_PUBLIC_SOURCES = [
  {
    id: 'website',
    label: 'Official Website',
    href: 'https://bulacan.gov.ph/',
  },
  {
    id: 'facebook',
    label: 'Official Facebook',
    href: 'https://www.facebook.com/PGBulacan/',
  },
];

const DEFAULT_FACEBOOK_PAGE_URL =
  process.env.REACT_APP_PUBLIC_FACEBOOK_PAGE_URL ||
  OFFICIAL_PUBLIC_SOURCES.find((source) => source.id === 'facebook')?.href ||
  '';

function decodeHtml(value) {
  if (typeof window === 'undefined' || !window.document) {
    return String(value || '')
      .replace(/&#8211;/g, '–')
      .replace(/&#8217;/g, "'")
      .replace(/&#038;/g, '&')
      .replace(/&amp;/g, '&');
  }

  const element = window.document.createElement('textarea');
  element.innerHTML = String(value || '');
  return element.value;
}

function stripHtml(value) {
  const decoded = decodeHtml(value);
  if (!decoded) {
    return '';
  }

  return decoded
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getFeaturedImage(post) {
  const media = post?._embedded?.['wp:featuredmedia']?.[0];
  if (!media) {
    return '';
  }

  return (
    media.media_details?.sizes?.large?.source_url ||
    media.media_details?.sizes?.medium_large?.source_url ||
    media.media_details?.sizes?.medium?.source_url ||
    media.source_url ||
    ''
  );
}

function normalizeOfficialNewsPost(post) {
  return {
    id: `official-news-${post.id}`,
    title: stripHtml(post.title?.rendered),
    summary: stripHtml(post.excerpt?.rendered || post.content?.rendered),
    publishedAt: post.date,
    href: post.link,
    imageUrl: getFeaturedImage(post),
    sourceName: 'Provincial Government of Bulacan',
    sourceLabel: 'Official Website',
  };
}

export function getOfficialFacebookEmbedUrl({
  pageHref = DEFAULT_FACEBOOK_PAGE_URL,
  width = FACEBOOK_PLUGIN_WIDTH,
  height = FACEBOOK_PLUGIN_HEIGHT,
} = {}) {
  const params = new URLSearchParams({
    href: pageHref,
    tabs: 'timeline',
    width: String(width),
    height: String(height),
    small_header: 'false',
    adapt_container_width: 'true',
    hide_cover: 'false',
    show_facepile: 'false',
  });

  return `https://www.facebook.com/plugins/page.php?${params.toString()}`;
}

export async function fetchOfficialBulacanNews({ signal } = {}) {
  const response = await fetch(OFFICIAL_BULACAN_NEWS_ENDPOINT, { signal });
  if (!response.ok) {
    throw new Error(`Official news request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload.map(normalizeOfficialNewsPost).filter((item) => item.title) : [];
}
