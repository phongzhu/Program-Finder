export function getProgramById(programs, programId) {
  return programs.find((program) => program.id === programId);
}

export function getApplicantApplications(data, session) {
  return data.applications.filter((application) => application.applicantEmail === session.email);
}

export function getApplicantNotifications(data, session) {
  return data.notifications.filter((notification) => notification.recipient === session.email);
}

export function getApplicantDocuments(data, session) {
  return data.documents.filter((document) => document.ownerEmail === session.email);
}

const PROGRAM_VISUAL_THEMES = {
  education: {
    accent: '#1d7b7f',
    from: '#1d7b7f',
    to: '#57b2ab',
    accentSoft: 'rgba(29, 123, 127, 0.16)',
    border: 'rgba(29, 123, 127, 0.18)',
    surface:
      'linear-gradient(135deg, rgba(29, 123, 127, 0.94) 0%, rgba(81, 178, 171, 0.86) 100%)',
    text: '#f4fffe',
    mutedText: 'rgba(244, 255, 254, 0.78)',
  },
  health: {
    accent: '#b85f39',
    from: '#b85f39',
    to: '#e9a46e',
    accentSoft: 'rgba(184, 95, 57, 0.14)',
    border: 'rgba(184, 95, 57, 0.18)',
    surface:
      'linear-gradient(135deg, rgba(184, 95, 57, 0.92) 0%, rgba(233, 164, 110, 0.82) 100%)',
    text: '#fff8f3',
    mutedText: 'rgba(255, 248, 243, 0.8)',
  },
  business: {
    accent: '#6e57c8',
    from: '#6e57c8',
    to: '#a283f6',
    accentSoft: 'rgba(110, 87, 200, 0.14)',
    border: 'rgba(110, 87, 200, 0.2)',
    surface:
      'linear-gradient(135deg, rgba(110, 87, 200, 0.92) 0%, rgba(162, 131, 246, 0.82) 100%)',
    text: '#f8f6ff',
    mutedText: 'rgba(248, 246, 255, 0.8)',
  },
  livelihood: {
    accent: '#0f7a56',
    from: '#0f7a56',
    to: '#5bb580',
    accentSoft: 'rgba(15, 122, 86, 0.14)',
    border: 'rgba(15, 122, 86, 0.18)',
    surface:
      'linear-gradient(135deg, rgba(15, 122, 86, 0.94) 0%, rgba(91, 181, 128, 0.84) 100%)',
    text: '#f5fff7',
    mutedText: 'rgba(245, 255, 247, 0.78)',
  },
  default: {
    accent: '#1e7d4d',
    from: '#1e7d4d',
    to: '#63b184',
    accentSoft: 'rgba(30, 125, 77, 0.12)',
    border: 'rgba(30, 125, 77, 0.16)',
    surface:
      'linear-gradient(135deg, rgba(30, 125, 77, 0.94) 0%, rgba(99, 177, 132, 0.84) 100%)',
    text: '#f7fff8',
    mutedText: 'rgba(247, 255, 248, 0.8)',
  },
};

function resolveProgramThemeKey(program) {
  const fingerprint = [
    program?.category,
    program?.programType,
    program?.sector,
    program?.title,
  ]
    .join(' ')
    .toLowerCase();

  if (fingerprint.includes('education') || fingerprint.includes('student')) return 'education';
  if (
    fingerprint.includes('health') ||
    fingerprint.includes('medical') ||
    fingerprint.includes('senior')
  ) {
    return 'health';
  }
  if (fingerprint.includes('business') || fingerprint.includes('enterprise')) return 'business';
  if (
    fingerprint.includes('livelihood') ||
    fingerprint.includes('employment') ||
    fingerprint.includes('training')
  ) {
    return 'livelihood';
  }

  return 'default';
}

export function getProgramVisualTheme(program) {
  return PROGRAM_VISUAL_THEMES[resolveProgramThemeKey(program)] || PROGRAM_VISUAL_THEMES.default;
}

export function getProgramImageSource(program) {
  return [program?.imageReference, program?.image]
    .find((value) => typeof value === 'string' && value.trim())
    ?.trim() || '';
}

function isPlaceholderProgramImageSource(source) {
  const normalized = String(source || '').trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return normalized.includes('picsum.photos') || normalized.includes('images.unsplash.com');
}

function escapeSvgText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function encodeSvg(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getProgramArtworkGlyph(program, stroke) {
  const key = resolveProgramThemeKey(program);

  if (key === 'education') {
    return `
      <g fill="none" stroke="${stroke}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
        <path d="M294 302 510 210l216 92-216 94-216-94Z" />
        <path d="M370 334v120c48 38 164 38 212 0V334" />
        <path d="M726 303v112" />
      </g>
    `;
  }

  if (key === 'health') {
    return `
      <g fill="none" stroke="${stroke}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="510" cy="314" r="118" />
        <path d="M510 242v144M438 314h144" />
        <path d="M350 500c40-78 108-116 160-116 54 0 122 38 160 116" opacity=".88" />
      </g>
    `;
  }

  if (key === 'business') {
    return `
      <g fill="none" stroke="${stroke}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
        <rect x="338" y="234" width="344" height="230" rx="42" />
        <path d="M404 234v-44c0-40 30-70 70-70h72c40 0 70 30 70 70v44" />
        <path d="M338 326h344" />
        <path d="M450 384h92M450 430h152" />
      </g>
    `;
  }

  if (key === 'livelihood') {
    return `
      <g fill="none" stroke="${stroke}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
        <path d="M510 482V246" />
        <path d="M510 342c-112 0-202-90-202-202 112 0 202 90 202 202Z" />
        <path d="M510 314c0-112 90-202 202-202 0 112-90 202-202 202Z" />
        <path d="M510 482c0 62 50 112 112 112" />
        <path d="M510 442c0 62-50 112-112 112" />
      </g>
    `;
  }

  return `
    <g fill="none" stroke="${stroke}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
      <rect x="360" y="186" width="300" height="300" rx="88" />
      <path d="M438 334h144M438 390h100M438 278h144" />
      <path d="M504 486v110" />
    </g>
  `;
}

export function getProgramPhotoSource(program) {
  const source = getProgramImageSource(program);
  return source && !isPlaceholderProgramImageSource(source) ? source : '';
}

export function getProgramIllustrationSource(program) {
  const theme = getProgramVisualTheme(program);
  const label = escapeSvgText(getProgramSurfaceLabel(program));
  const municipality = escapeSvgText(program?.municipality || 'Province-wide');
  const category = escapeSvgText(program?.category || 'Government support');
  const office = escapeSvgText(program?.office || 'Program office');
  const glyph = getProgramArtworkGlyph(program, 'rgba(255,255,255,0.94)');

  return encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" fill="none">
      <defs>
        <linearGradient id="bg" x1="140" y1="80" x2="1060" y2="660" gradientUnits="userSpaceOnUse">
          <stop stop-color="${theme.from}" />
          <stop offset="1" stop-color="${theme.to}" />
        </linearGradient>
        <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(930 160) rotate(128.283) scale(438.197 592.488)">
          <stop stop-color="white" stop-opacity=".32" />
          <stop offset="1" stop-color="white" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="720" fill="url(#bg)" />
      <rect width="1200" height="720" fill="url(#glow)" />
      <circle cx="960" cy="114" r="188" fill="rgba(255,255,255,.08)" />
      <circle cx="222" cy="612" r="220" fill="rgba(255,255,255,.06)" />
      <path d="M0 600C148 540 272 512 408 540c152 32 244 120 402 112 156-8 250-88 390-146v214H0V600Z" fill="rgba(8,16,11,.1)" />
      <rect x="72" y="72" width="340" height="56" rx="28" fill="rgba(255,255,255,.16)" />
      <rect x="920" y="72" width="208" height="56" rx="28" fill="rgba(8,16,11,.18)" />
      <text x="104" y="108" fill="white" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing=".08em">${label}</text>
      <text x="964" y="108" fill="white" font-family="Arial, sans-serif" font-size="28" font-weight="700">${municipality}</text>
      <g opacity=".24">
        <path d="M810 134H1136M760 202H1090M712 270h350M690 338h298" stroke="white" stroke-width="16" stroke-linecap="round" />
      </g>
      ${glyph}
      <text x="86" y="630" fill="rgba(255,255,255,.9)" font-family="Arial, sans-serif" font-size="34" font-weight="700">${category}</text>
      <text x="86" y="670" fill="rgba(255,255,255,.72)" font-family="Arial, sans-serif" font-size="24" font-weight="600">${office}</text>
    </svg>
  `);
}

export function getProgramInitials(program) {
  return String(program?.title || program?.category || 'Program')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function getProgramSurfaceLabel(program) {
  return String(program?.programType || program?.category || 'Government support');
}

export function formatProgramDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return 'Schedule pending';

  const parsedValue = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedValue.getTime())) return value;

  return parsedValue.toLocaleDateString('en-US', options);
}

export function formatProgramWindow(program) {
  if (program?.applicationStartDate && program?.applicationEndDate) {
    return `${formatProgramDate(program.applicationStartDate)} to ${formatProgramDate(program.applicationEndDate)}`;
  }

  if (program?.deadline) {
    return `Until ${formatProgramDate(program.deadline)}`;
  }

  return 'Schedule pending';
}

export function getProgramCapacity(program) {
  return Number(program?.maxBeneficiaries || program?.slots || 0);
}
