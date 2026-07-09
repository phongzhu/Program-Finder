import { useEffect, useState } from 'react';

const ASSISTANCE_NEEDS = [
  { value: 'education', label: 'Education support' },
  { value: 'financial', label: 'Financial assistance' },
  { value: 'medical', label: 'Medical / health assistance' },
  { value: 'livelihood', label: 'Livelihood / job opportunities' },
  { value: 'disaster_relief', label: 'Disaster relief' },
  { value: 'social_welfare', label: 'Social welfare (senior, PWD, etc.)' },
  { value: 'general', label: 'General programs / any available' },
];

const APPLICANT_TYPES = [
  { value: 'student', label: 'Student' },
  { value: 'parent_guardian', label: 'Parent / Guardian' },
  { value: 'senior_citizen', label: 'Senior citizen' },
  { value: 'pwd', label: 'Person with disability (PWD)' },
  { value: 'solo_parent', label: 'Solo parent' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'employed_low_income', label: 'Employed but low-income' },
  { value: 'ofw_family', label: 'OFW / OFW family' },
  { value: 'farmer', label: 'Farmer' },
  { value: 'fisherfolk', label: 'Fisherfolk' },
  { value: 'general_resident', label: 'None / General resident' },
];

const INCOME_BRACKETS = [
  { value: 'below_10k', label: 'Below ₱10,000' },
  { value: '10k_20k', label: '₱10,000 – ₱20,000' },
  { value: '20k_50k', label: '₱20,000 – ₱50,000' },
  { value: 'above_50k', label: 'Above ₱50,000' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const EDUCATION_STATUSES = [
  { value: 'elementary', label: 'Elementary' },
  { value: 'high_school', label: 'High school' },
  { value: 'college', label: 'College' },
  { value: 'not_studying', label: 'Not studying' },
];

function MultiCheckGroup({ options, selected, onChange, disabled }) {
  const toggle = (value) => {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.6rem' }}>
      {options.map(({ value, label }) => {
        const checked = selected.includes(value);
        return (
          <label
            key={value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 0.85rem',
              borderRadius: 14,
              border: `1px solid ${checked ? 'rgba(24,111,67,.35)' : 'rgba(18,32,25,.08)'}`,
              background: checked ? 'rgba(24,111,67,.07)' : 'rgba(246,249,245,.95)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem',
              transition: 'background 0.15s, border-color 0.15s',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <input
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(value)}
              style={{ width: '1rem', height: '1rem', accentColor: 'var(--pf-green, #186f43)', flexShrink: 0 }}
              type="checkbox"
            />
            {label}
          </label>
        );
      })}
    </div>
  );
}

function SingleSelectGroup({ options, selected, onChange, disabled }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.6rem' }}>
      {options.map(({ value, label }) => {
        const checked = selected === value;
        return (
          <label
            key={value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 0.85rem',
              borderRadius: 14,
              border: `1px solid ${checked ? 'rgba(24,111,67,.35)' : 'rgba(18,32,25,.08)'}`,
              background: checked ? 'rgba(24,111,67,.07)' : 'rgba(246,249,245,.95)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem',
              transition: 'background 0.15s, border-color 0.15s',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <input
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(value)}
              style={{ width: '1rem', height: '1rem', accentColor: 'var(--pf-green, #186f43)', flexShrink: 0 }}
              type="radio"
            />
            {label}
          </label>
        );
      })}
    </div>
  );
}

function SurveySection({ number, title, subtitle, children }) {
  return (
    <section
      style={{
        padding: '1.25rem 1.35rem',
        borderRadius: 22,
        border: '1px solid rgba(24,111,67,.08)',
        background: 'rgba(255,255,255,.95)',
        boxShadow: 'var(--pf-shadow-sm)',
        display: 'grid',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'grid', gap: '0.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'rgba(24,111,67,.12)',
              color: 'var(--pf-green, #186f43)',
              fontSize: '0.78rem',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {number}
          </span>
          <strong style={{ fontSize: '0.96rem' }}>{title}</strong>
        </div>
        {subtitle ? (
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--pf-ink-muted)', paddingLeft: '2.1rem' }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function ApplicantOnboardingSurveyScreen({ session, data, actions, navigate }) {
  const [assistanceNeeds, setAssistanceNeeds] = useState([]);
  const [applicantTypes, setApplicantTypes] = useState([]);
  const [isCurrentResident, setIsCurrentResident] = useState(null);
  const [householdIncomeBracket, setHouseholdIncomeBracket] = useState('');
  const [educationStatus, setEducationStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const surveyCompleted = Boolean(data?.applicantProfile?.searchSurvey?.completedAt);

  useEffect(() => {
    if (surveyCompleted && typeof navigate === 'function') {
      navigate('/applicant/dashboard', { replace: true });
    }
  }, [navigate, surveyCompleted]);

  if (surveyCompleted) {
    return null;
  }

  const canSubmit = assistanceNeeds.length > 0 || applicantTypes.length > 0;

  const saveSurveyAndReturnToDashboard = async (payload) => {
    setSaving(true);

    try {
      const result = await actions.saveApplicantOnboardingSurvey(payload);
      if (result?.ok && typeof navigate === 'function') {
        navigate('/applicant/dashboard', { replace: true });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    await saveSurveyAndReturnToDashboard({
      assistanceNeeds,
      applicantTypes,
      isCurrentResident,
      householdIncomeBracket: householdIncomeBracket || null,
      educationStatus: educationStatus || null,
    });
  };

  const handleSkip = async () => {
    await saveSurveyAndReturnToDashboard({
      assistanceNeeds: [],
      applicantTypes: [],
      isCurrentResident: null,
      householdIncomeBracket: null,
      educationStatus: null,
    });
  };

  return (
    <div
      style={{
        maxWidth: '52rem',
        margin: '0 auto',
        display: 'grid',
        gap: '1.25rem',
        padding: '0.5rem 0 2rem',
      }}
    >
      <div
        style={{
          padding: '1.5rem 1.6rem',
          borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(24,111,67,.08) 0%, rgba(244,197,66,.1) 100%)',
          border: '1px solid rgba(24,111,67,.1)',
        }}
      >
        <p
          style={{
            margin: '0 0 0.35rem',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--pf-green, #186f43)',
          }}
        >
          Quick setup
        </p>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.55rem', fontFamily: 'var(--pf-font-display)', lineHeight: 1.15 }}>
          Welcome{session?.name ? `, ${session.name.split(' ')[0]}` : ''}!
        </h1>
        <p style={{ margin: 0, color: 'var(--pf-ink-muted)', lineHeight: 1.6, maxWidth: '38rem' }}>
          Answer a few quick questions so we can show you programs you are most likely to qualify for. This takes less than a minute.
        </p>
      </div>

      <SurveySection
        number={1}
        title="What kind of assistance are you looking for?"
        subtitle="Select all that apply."
      >
        <MultiCheckGroup
          disabled={saving}
          onChange={setAssistanceNeeds}
          options={ASSISTANCE_NEEDS}
          selected={assistanceNeeds}
        />
      </SurveySection>

      <SurveySection
        number={2}
        title="Which best describes you?"
        subtitle="Select all that apply."
      >
        <MultiCheckGroup
          disabled={saving}
          onChange={setApplicantTypes}
          options={APPLICANT_TYPES}
          selected={applicantTypes}
        />
      </SurveySection>

      <SurveySection
        number={3}
        title="Are you currently residing in this municipality?"
      >
        <SingleSelectGroup
          disabled={saving}
          onChange={(value) => setIsCurrentResident(value === 'yes')}
          options={[
            { value: 'yes', label: 'Yes, I am a current resident' },
            { value: 'no', label: 'No, I will still browse programs' },
          ]}
          selected={isCurrentResident === null ? '' : isCurrentResident ? 'yes' : 'no'}
        />
      </SurveySection>

      <SurveySection
        number={4}
        title="Estimated monthly household income"
        subtitle="Used only to match eligibility criteria — your answer stays private."
      >
        <SingleSelectGroup
          disabled={saving}
          onChange={setHouseholdIncomeBracket}
          options={INCOME_BRACKETS}
          selected={householdIncomeBracket}
        />
      </SurveySection>

      <SurveySection
        number={5}
        title="Current education status"
      >
        <SingleSelectGroup
          disabled={saving}
          onChange={setEducationStatus}
          options={EDUCATION_STATUSES}
          selected={educationStatus}
        />
      </SurveySection>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          padding: '1rem 1.35rem',
          borderRadius: 22,
          background: 'rgba(255,255,255,.95)',
          border: '1px solid rgba(18,32,25,.06)',
          boxShadow: 'var(--pf-shadow-sm)',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--pf-ink-muted)' }}>
          Your answers help us surface the most relevant programs. You can update them anytime from your profile.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
          <button
            disabled={saving}
            onClick={handleSkip}
            style={{
              padding: '0.75rem 1.1rem',
              borderRadius: 14,
              border: '1px solid rgba(18,32,25,.1)',
              background: 'transparent',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              color: 'var(--pf-ink-muted)',
            }}
            type="button"
          >
            Skip for now
          </button>
          <button
            className="primary-button"
            disabled={!canSubmit || saving}
            onClick={handleSubmit}
            type="button"
          >
            {saving ? 'Saving...' : 'Continue to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
