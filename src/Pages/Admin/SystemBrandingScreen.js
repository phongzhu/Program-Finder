import { useEffect, useMemo, useState } from 'react';
import { AppButton, FileTriggerButton, FormField, SectionHeading } from 'Components/UI';
import { WORKSPACE_CONTROL_STYLE, WORKSPACE_LABEL_STYLE } from 'Components/UI/workspaceTheme';

const COLOR_KEYS = [
  { key: 'primaryColor', label: 'Primary Color' },
  { key: 'secondaryColor', label: 'Secondary Color' },
  { key: 'tertiaryColor', label: 'Tertiary Color' },
  { key: 'primaryTextColor', label: 'Primary Text Color' },
  { key: 'secondaryTextColor', label: 'Secondary Text Color' },
  { key: 'tertiaryTextColor', label: 'Tertiary Text Color' },
];

const SHELL_STYLE = {
  display: 'grid',
  gap: '1rem',
};

const GRID_STYLE = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
};

const PREVIEW_STYLE = {
  borderRadius: '18px',
  border: '1px solid var(--pf-border, rgba(18, 35, 58, 0.12))',
  background: 'var(--pf-card, rgba(255, 255, 255, 0.98))',
  padding: '1rem',
  display: 'grid',
  gap: '0.75rem',
};

function hexToRgb(hex) {
  const normalized = String(hex || '').replace('#', '');

  if (!/^([0-9a-fA-F]{6})$/.test(normalized)) {
    return { r: 0, g: 0, b: 0 };
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgba(hex, alpha) {
  const color = hexToRgb(hex);
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function normalizeColor(value, fallback) {
  return /^#([0-9a-fA-F]{6})$/.test(String(value || '')) ? String(value) : fallback;
}

function toFormState(source = {}) {
  return {
    id: source.id || null,
    primaryColor: normalizeColor(source.primaryColor, '#0f2f56'),
    secondaryColor: normalizeColor(source.secondaryColor, '#d4af37'),
    tertiaryColor: normalizeColor(source.tertiaryColor, '#f3f4f6'),
    primaryTextColor: normalizeColor(source.primaryTextColor, '#111827'),
    secondaryTextColor: normalizeColor(source.secondaryTextColor, '#374151'),
    tertiaryTextColor: normalizeColor(source.tertiaryTextColor, '#6b7280'),
    systemName: String(source.systemName || 'ProgramFinder'),
    systemDescription: String(source.systemDescription || ''),
    systemTagline: String(source.systemTagline || ''),
    fontFamily: String(source.fontFamily || 'Arial, Helvetica, sans-serif'),
    logoIcon: String(source.logoIcon || ''),
    logoUrl: String(source.logoUrl || ''),
  };
}

function ColorField({ label, value, onChange }) {
  return (
    <label style={{ display: 'grid', gap: '0.45rem' }}>
      <span style={{ fontWeight: 700, color: 'var(--pf-ink)' }}>{label}</span>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '3.25rem minmax(0, 1fr)',
          gap: '0.55rem',
          alignItems: 'center',
        }}
      >
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={{
            width: '3.25rem',
            height: '2.6rem',
            padding: '0.2rem',
            borderRadius: '10px',
            border: '1px solid var(--pf-border, rgba(18, 35, 58, 0.12))',
            background: 'var(--pf-card)',
            cursor: 'pointer',
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#000000"
          style={{
            width: '100%',
            minHeight: '2.55rem',
            borderRadius: '10px',
            border: '1px solid var(--pf-border, rgba(18, 35, 58, 0.12))',
            padding: '0.55rem 0.7rem',
            fontWeight: 600,
          }}
        />
      </div>
    </label>
  );
}

export default function SystemBrandingScreen({ data, actions }) {
  const [form, setForm] = useState(() => toFormState(data.uiBranding));
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingLogoFile, setPendingLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(() => String(data.uiBranding?.logoUrl || ''));

  useEffect(() => {
    setForm(toFormState(data.uiBranding));
    setLogoPreviewUrl(String(data.uiBranding?.logoUrl || ''));
    setPendingLogoFile(null);
  }, [data.uiBranding]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  const previewName = useMemo(
    () => String(form.systemName || 'ProgramFinder').trim() || 'ProgramFinder',
    [form.systemName]
  );

  const previewAccent = form.primaryColor;
  const previewAccentSoft = rgba(form.primaryColor, 0.12);
  const previewPageBg = `linear-gradient(180deg, ${rgba(form.tertiaryColor, 0.94)} 0%, ${rgba(form.tertiaryColor, 0.86)} 100%)`;
  const previewCardBg = `linear-gradient(180deg, ${rgba('#ffffff', 0.9)} 0%, ${rgba(form.tertiaryColor, 0.72)} 100%)`;
  const previewHeroBg = `linear-gradient(135deg, ${rgba(form.primaryColor, 0.98)} 0%, ${rgba(form.primaryColor, 0.82)} 56%, ${rgba(form.secondaryColor, 0.92)} 100%)`;
  const previewHeroText = form.tertiaryTextColor;
  const previewMuted = form.secondaryTextColor;

  const CONTAINER_STYLE = {
    display: 'grid',
    gap: '0.5rem',
    gridTemplateColumns: 'minmax(0, 0.92fr) minmax(0, 1.08fr)',
    alignItems: 'start',
  };

  const STICKY_PREVIEW_WRAPPER = {
    position: 'sticky',
    top: '1.25rem',
    alignSelf: 'start',
    width: '100%',
    minWidth: 0,
  };

  const handleColorChange = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: normalizeColor(value, current[key]),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    let nextForm = form;

    if (pendingLogoFile) {
      setIsUploading(true);
      const uploadResult = await actions.uploadSystemBrandingLogo(pendingLogoFile);
      setIsUploading(false);

      if (!uploadResult?.ok || !uploadResult.logoUrl) {
        setIsSaving(false);
        return;
      }

      nextForm = { ...form, logoUrl: uploadResult.logoUrl };
      setForm(nextForm);
      setLogoPreviewUrl(uploadResult.logoUrl);
      setPendingLogoFile(null);
    }

    await actions.saveSystemBranding(nextForm);
    setIsSaving(false);
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (logoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    setPendingLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
    event.target.value = '';
  };

  return (
    <div style={{ ...SHELL_STYLE, paddingRight: 0 }}>
      <div style={CONTAINER_STYLE}>
        {/* Left column: controls */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div className="section-card" style={{ display: 'grid', gap: '0.85rem' }}>
            <SectionHeading
              eyebrow="Admin customization"
              title="System Branding"
              text="Apply the platform logo, naming, and color palette across all pages in real time."
            />

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={GRID_STYLE}>
                <FormField
                  label="System Name"
                  required
                  value={form.systemName}
                  onChange={(value) => setForm((current) => ({ ...current, systemName: value }))}
                  placeholder="ProgramFinder"
                />
                <label style={{ display: 'grid', gap: '0.45rem' }}>
                  <span style={WORKSPACE_LABEL_STYLE}>Font Family</span>
                  <select
                    value={form.fontFamily}
                    onChange={(e) => setForm((current) => ({ ...current, fontFamily: e.target.value }))}
                    style={{
                      ...WORKSPACE_CONTROL_STYLE,
                      minHeight: '2.85rem',
                      padding: '0.5rem 0.75rem',
                    }}
                  >
                    <option value={'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial'}>
                      System UI / Inter
                    </option>
                    <option value={'Arial, Helvetica, sans-serif'}>Arial</option>
                    <option value={'Roboto, sans-serif'}>Roboto</option>
                    <option value={'Poppins, sans-serif'}>Poppins</option>
                    <option value={'Montserrat, sans-serif'}>Montserrat</option>
                    <option value={'Noto Sans, sans-serif'}>Noto Sans</option>
                    <option value={'Georgia, serif'}>Georgia</option>
                    <option value={'"Times New Roman", Times, serif'}>Times New Roman</option>
                  </select>
                </label>
              </div>

              <FormField
                label="System Tagline"
                value={form.systemTagline}
                onChange={(value) => setForm((current) => ({ ...current, systemTagline: value }))}
                placeholder="Service support for every resident"
              />
              <FormField
                label="System Description"
                type="textarea"
                value={form.systemDescription}
                onChange={(value) => setForm((current) => ({ ...current, systemDescription: value }))}
                placeholder="Describe the platform shown in headers, metadata, and admin references."
              />
            </div>
          </div>

          <div className="section-card" style={{ display: 'grid', gap: '0.95rem' }}>
            <SectionHeading
              eyebrow="Palette"
              title="Theme Colors"
              text="These values update the global CSS variables used by public, auth, and dashboard screens."
            />
            <div style={GRID_STYLE}>
              {COLOR_KEYS.map((item) => (
                <ColorField
                  key={item.key}
                  label={item.label}
                  value={form[item.key]}
                  onChange={(value) => handleColorChange(item.key, value)}
                />
              ))}
            </div>
          </div>

          <div className="section-card" style={{ display: 'grid', gap: '0.9rem' }}>
            <SectionHeading
              eyebrow="Logo"
              title="Brand Image"
              text="Upload a logo to Supabase bucket programfinder-logos and use its public URL globally."
            />

            <FileTriggerButton
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="system-branding-upload-button"
              disabled={isUploading}
              onChange={handleLogoUpload}
              style={{
                minHeight: '3rem',
                borderRadius: '14px',
                background: 'var(--pf-setting-primary)',
                borderColor: 'var(--pf-setting-primary)',
                color: 'var(--pf-setting-tertiary-text)',
              }}
            >
              {isUploading ? 'Uploading logo...' : 'Upload Logo'}
            </FileTriggerButton>

            <FormField
              label="Logo Icon Label (optional)"
              value={form.logoIcon}
              onChange={(value) => setForm((current) => ({ ...current, logoIcon: value }))}
              placeholder="PF"
            />
          </div>
        </div>

        {/* Right column: sticky preview */}
        <div style={STICKY_PREVIEW_WRAPPER}>
          <div className="section-card" style={{ display: 'grid', gap: '0.8rem', width: '100%' }}>
            <SectionHeading
              eyebrow="Preview"
              title={previewName}
              text={form.systemTagline || 'Global branding preview'}
            />

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.45rem',
                alignItems: 'center',
              }}
            >
              {[
                { label: 'Name', value: previewName },
                { label: 'Font', value: form.fontFamily.split(',')[0].replace(/"/g, '') },
                { label: 'Primary', value: form.primaryColor },
                { label: 'Secondary', value: form.secondaryColor },
                { label: 'Tertiary', value: form.tertiaryColor },
              ].map((item) => (
                <span
                  key={item.label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.65rem',
                    borderRadius: '999px',
                    border: `1px solid ${rgba(form.primaryColor, 0.1)}`,
                    background: rgba('#ffffff', 0.72),
                    color: form.primaryTextColor,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}
                >
                  <strong style={{ color: previewMuted }}>{item.label}</strong>
                  <span>{item.value}</span>
                </span>
              ))}
            </div>

            <div
              style={{
                ...PREVIEW_STYLE,
                padding: '0',
                overflow: 'hidden',
                background: previewPageBg,
                color: form.primaryTextColor,
                fontFamily: form.fontFamily,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.9rem 1rem',
                  background: rgba(form.primaryColor, 0.96),
                  color: previewHeroText,
                  borderBottom: `1px solid ${rgba(form.primaryColor, 0.18)}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <div
                    style={{
                      width: '2.75rem',
                      height: '2.75rem',
                      borderRadius: '12px',
                      background: rgba('#ffffff', 0.14),
                      border: `1px solid ${rgba('#ffffff', 0.18)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {logoPreviewUrl ? (
                      <img
                        alt="System logo preview"
                        src={logoPreviewUrl}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{form.logoIcon || 'PF'}</span>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem', lineHeight: 1.15 }}>
                      {previewName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: rgba(previewHeroText, 0.82) }}>
                      {form.systemTagline || 'Service Support for Every Resident'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                  <span
                    style={{
                      padding: '0.35rem 0.6rem',
                      borderRadius: '999px',
                      background: rgba('#ffffff', 0.14),
                      border: `1px solid ${rgba('#ffffff', 0.12)}`,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    Live preview
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '0.9rem', padding: '1rem' }}>
                <section
                  style={{
                    borderRadius: '20px',
                    background: previewHeroBg,
                    color: previewHeroText,
                    padding: '1.1rem',
                    boxShadow: `0 18px 30px ${rgba(form.primaryColor, 0.18)}`,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'grid', gap: '0.65rem', maxWidth: '24rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        width: 'fit-content',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '999px',
                        background: rgba('#ffffff', 0.14),
                        border: `1px solid ${rgba('#ffffff', 0.16)}`,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Public portal
                    </span>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.55rem',
                        lineHeight: 1.1,
                        letterSpacing: '-0.03em',
                        fontFamily: form.fontFamily,
                      }}
                    >
                      {previewName}
                    </h3>
                    <p style={{ margin: 0, color: rgba(previewHeroText, 0.88), lineHeight: 1.65 }}>
                      {form.systemDescription || 'Find eligible programs, submit applications, and track status from one place.'}
                    </p>
                    <div
                      style={{
                        display: 'grid',
                        gap: '0.35rem',
                        marginTop: '0.25rem',
                        padding: '0.8rem 0.9rem',
                        borderRadius: '14px',
                        background: rgba('#ffffff', 0.1),
                        border: `1px solid ${rgba('#ffffff', 0.14)}`,
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Live text sample
                      </span>
                      <p style={{ margin: 0, lineHeight: 1.7 }}>
                        <span style={{ color: previewHeroText, fontWeight: 700 }}>Primary text</span>{' '}
                        stays visible,{' '}
                        <span style={{ color: form.secondaryTextColor }}>secondary text</span>{' '}
                        shifts with the palette, and{' '}
                        <span style={{ color: form.tertiaryTextColor }}>tertiary text</span>{' '}
                        follows the soft surface tone.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                      <span
                        style={{
                          padding: '0.7rem 1rem',
                          borderRadius: '14px',
                          background: rgba('#ffffff', 0.92),
                          color: previewAccent,
                          fontWeight: 800,
                          boxShadow: '0 12px 22px rgba(0, 0, 0, 0.14)',
                        }}
                      >
                        Get Started
                      </span>
                      <span
                        style={{
                          padding: '0.7rem 1rem',
                          borderRadius: '14px',
                          background: rgba('#ffffff', 0.12),
                          border: `1px solid ${rgba('#ffffff', 0.16)}`,
                          fontWeight: 700,
                        }}
                      >
                        Learn More
                      </span>
                    </div>
                  </div>
                </section>

                <section style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gap: '0.45rem' }}>
                    <strong style={{ fontSize: '0.9rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Featured services
                    </strong>
                    <p style={{ margin: 0, color: previewMuted, lineHeight: 1.6 }}>
                      A quick sample of how the branded page will feel to visitors.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                    {[
                      { title: 'Program Search', text: 'Browse available assistance programs and filter by eligibility.' },
                      { title: 'Application Tracking', text: 'Continue saved applications and review status updates at a glance.' },
                      { title: 'Official Notices', text: 'See announcements and updates published by your local office.' },
                    ].map((item) => (
                      <article
                        key={item.title}
                        style={{
                          borderRadius: '18px',
                          background: previewCardBg,
                          border: `1px solid ${rgba(form.primaryColor, 0.1)}`,
                          padding: '0.9rem',
                          minHeight: '7.2rem',
                          display: 'grid',
                          gap: '0.5rem',
                          boxShadow: `0 10px 18px ${rgba(form.primaryColor, 0.06)}`,
                        }}
                      >
                        <span
                          style={{
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '10px',
                            background: previewAccentSoft,
                            color: previewAccent,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                          }}
                        >
                          •
                        </span>
                        <strong style={{ fontSize: '0.98rem' }}>{item.title}</strong>
                        <p style={{ margin: 0, color: previewMuted, lineHeight: 1.55, fontSize: '0.92rem' }}>
                          {item.text}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>

                <section
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  {[
                    { label: 'Residents served', value: '24,000+' },
                    { label: 'Programs listed', value: '118' },
                    { label: 'Active notices', value: '16' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        borderRadius: '16px',
                        background: rgba('#ffffff', 0.7),
                        border: `1px solid ${rgba(form.primaryColor, 0.08)}`,
                        padding: '0.8rem',
                      }}
                    >
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: previewAccent }}>{item.value}</div>
                      <div style={{ fontSize: '0.82rem', color: previewMuted }}>{item.label}</div>
                    </div>
                  ))}
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <AppButton
          className="system-branding-save-button"
          disabled={isSaving || isUploading}
          onClick={handleSave}
          labelClassName="system-branding-save-button-label"
          style={{
            minHeight: '3rem',
            minWidth: '12rem',
            background: 'var(--pf-setting-primary)',
            borderColor: 'var(--pf-setting-primary)',
            color: 'var(--pf-setting-tertiary-text)',
          }}
        >
          {isSaving ? 'Saving...' : 'Save Branding'}
        </AppButton>
      </div>
    </div>
  );
}
