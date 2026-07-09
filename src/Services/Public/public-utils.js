export function formatPublicDate(value) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

export function getProgramPriority(status) {
  if (status === 'Open') {
    return 0;
  }

  if (status === 'Upcoming') {
    return 1;
  }

  return 2;
}

export function getProgramStatusClass(status) {
  if (status === 'Open') {
    return 'pf-pill-open';
  }

  if (status === 'Upcoming') {
    return 'pf-pill-upcoming';
  }

  return 'pf-pill-closed';
}

export function getOnlineIconUrl(icon, color) {
  return `https://api.iconify.design/${icon}.svg?color=%23${color}`;
}
