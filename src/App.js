import { useEffect, useRef, useState } from 'react';
import './App.css';
import { DashboardLayout } from './app/layouts/DashboardLayout';
import { MODULE_REGISTRY } from './app/moduleRegistry';
import { usePrototypeApp } from './app/usePrototypeApp';
import { Toast } from './shared/components/ui';
import { ADMIN_SCREENS } from './modules/admin/screens/index';
import { PERSONNEL_SCREENS } from './modules/personnel/screens/index';
import { APPLICANT_SCREENS } from './modules/applicant/screens/index';
import { RoleLoginPage } from './modules/auth/screens';
import PersonnelLoginPage from './modules/auth/personnel-login';

const SCREEN_REGISTRY = {
  admin: ADMIN_SCREENS,
  personnel: PERSONNEL_SCREENS,
  applicant: APPLICANT_SCREENS,
};

const PUBLIC_NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'programs', label: 'Programs' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Contact' },
];

const OVERVIEW_ITEMS = [
  { icon: 'ph:magnifying-glass', text: 'Search available government programs' },
  { icon: 'ph:check-circle', text: 'Check possible eligibility' },
  { icon: 'ph:file-text', text: 'View application requirements' },
  { icon: 'ph:clock-counter-clockwise', text: 'Track applications once registered' },
  { icon: 'ph:bell-ringing', text: 'Receive updates and announcements' },
];

const HOW_IT_WORKS_STEPS = [
  {
    number: '01',
    title: 'Create an Account',
    text: 'Sign up and complete your applicant profile so the system can guide you to the right programs.',
  },
  {
    number: '02',
    title: 'Find Programs',
    text: 'Browse scholarships, medical assistance, livelihood support, and other open government programs.',
  },
  {
    number: '03',
    title: 'Check Eligibility',
    text: 'Review the programs that may match your profile, requirements, and current situation.',
  },
  {
    number: '04',
    title: 'Apply and Track',
    text: 'Submit your application and monitor its progress from the applicant dashboard.',
  },
];

const FEATURE_ITEMS = [
  {
    icon: 'ph:target',
    title: 'Easy Program Discovery',
    text: 'Surface the right programs faster with categorized, searchable listings.',
  },
  {
    icon: 'ph:buildings',
    title: 'Multi-Office Access',
    text: 'One place for programs across participating Bulacan offices and public service units.',
  },
  {
    icon: 'ph:shield-check',
    title: 'Guided Eligibility',
    text: 'Profile-based hints show which public programs may fit your current situation.',
  },
  {
    icon: 'ph:folder-open',
    title: 'Organized Requirements',
    text: 'Clear lists of what documents you need before you begin an application.',
  },
  {
    icon: 'ph:chart-bar',
    title: 'Application Tracking',
    text: 'Follow your application status in real time from a single dashboard.',
  },
  {
    icon: 'ph:megaphone-simple',
    title: 'Timely Announcements',
    text: 'Never miss a deadline, update, or office notice tied to open programs.',
  },
];

const PROGRAM_CATEGORIES = [
  {
    title: 'Education Assistance',
    text: 'Scholarships, tuition support, school supplies, and student-focused grants.',
  },
  {
    title: 'Medical Assistance',
    text: 'Subsidies for consultations, medicine, diagnostics, and treatment support.',
  },
  {
    title: 'Livelihood Support',
    text: 'Startup kits, skills programs, and micro-enterprise assistance for residents.',
  },
  {
    title: 'Financial Assistance',
    text: 'Cash aid and emergency financial support for qualified households.',
  },
  {
    title: 'Housing Assistance',
    text: 'Shelter-related support, repairs, and relocation-linked public programs.',
  },
  {
    title: 'Disaster Recovery',
    text: 'Relief and recovery support for residents affected by emergencies and calamities.',
  },
  {
    title: 'Senior Citizen Programs',
    text: 'Health, subsidy, and welfare assistance tailored to senior residents.',
  },
  {
    title: 'PWD Programs',
    text: 'Targeted support for persons with disabilities, including health and livelihood aid.',
  },
  {
    title: 'Solo Parent Programs',
    text: 'Support services and benefits designed for solo parents and their dependents.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Who can use ProgramFinder Bulacan?',
    answer:
      'Residents looking for scholarships, aid, assistance, or other public programs in Bulacan can start here and continue through the applicant portal.',
  },
  {
    question: 'Can I browse programs without logging in?',
    answer:
      'Yes. The landing page previews open opportunities and public announcements, while full eligibility and application tools stay inside the applicant account.',
  },
  {
    question: 'What happens after I log in?',
    answer:
      'You gain access to applicant-only tools such as profile completion, program matching, requirements handling, submissions, and status tracking.',
  },
  {
    question: 'Will I see announcements and deadlines here?',
    answer:
      'Yes. Public notices and open-program reminders are surfaced on the homepage so visitors can see that the platform is active.',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatPublicDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function getProgramPriority(status) {
  if (status === 'Open') return 0;
  if (status === 'Upcoming') return 1;
  return 2;
}

function getProgramStatusClass(status) {
  if (status === 'Open') return 'pf-pill-open';
  if (status === 'Upcoming') return 'pf-pill-upcoming';
  return 'pf-pill-closed';
}

function getOnlineIconUrl(icon, color) {
  return `https://api.iconify.design/${icon}.svg?color=%23${color}`;
}

// ─── Shared UI Atoms ─────────────────────────────────────────────────────────

function OnlineIcon({ icon, color, className }) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={className}
      decoding="async"
      loading="lazy"
      src={getOnlineIconUrl(icon, color)}
    />
  );
}

function PublicSectionHeading({ eyebrow, title, text, dark = false }) {
  return (
    <div className={`pf-sec-header pf-fade-up ${dark ? 'is-dark' : ''}`}>
      <span className="pf-sec-eyebrow">{eyebrow}</span>
      <h2 className="pf-sec-title">{title}</h2>
      {text && <p className="pf-sec-text">{text}</p>}
    </div>
  );
}

// ─── Mobile Menu ─────────────────────────────────────────────────────────────

function MobileMenu({ open, onClose, scrollToSection, navigate }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleNav = (id) => {
    scrollToSection(id);
    onClose();
  };

  return (
    <div className={`pf-mobile-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="pf-mobile-menu-backdrop" onClick={onClose} />
      <nav className="pf-mobile-menu-panel">
        <button className="pf-mobile-menu-close" onClick={onClose} aria-label="Close menu">
          &#x2715;
        </button>
        <div className="pf-mobile-menu-links">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <button
              className="pf-mobile-nav-link"
              key={item.id}
              onClick={() => handleNav(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="pf-mobile-menu-actions">
          <button
            className="pf-btn-ghost pf-btn-full"
            onClick={() => { navigate('/login/applicant'); onClose(); }}
          >
            Log In
          </button>
          <button
            className="pf-btn-primary pf-btn-full"
            onClick={() => { navigate('/login/applicant'); onClose(); }}
          >
            Sign Up &rarr;
          </button>
        </div>
      </nav>
    </div>
  );
}

// ─── Public Landing Page ──────────────────────────────────────────────────────

function PublicLandingPage({ data, navigate }) {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const pageRef = useRef(null);

  // ── Derived data ──────────────────────────────────────────────────────────

  const featuredPrograms = [...data.programs]
    .sort((a, b) => {
      const diff = getProgramPriority(a.status) - getProgramPriority(b.status);
      return diff !== 0 ? diff : b.fitScore - a.fitScore;
    })
    .slice(0, 4);

  const deadlinePrograms = [...data.programs]
    .filter((p) => ['Open', 'Upcoming'].includes(p.status))
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  const latestAnnouncements = [...data.announcements]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  const stats = [
    { value: data.programs.filter((p) => p.status === 'Open').length, label: 'Open Programs' },
    { value: data.offices.length, label: 'Offices' },
    { value: data.announcements.length, label: 'Notices' },
    { value: data.applications.length, label: 'Tracked Apps' },
  ];

  const safeSlideIndex = featuredPrograms.length ? currentSlide % featuredPrograms.length : 0;
  const activeProgram = featuredPrograms[safeSlideIndex] || null;

  // ── Scroll helper ─────────────────────────────────────────────────────────

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!featuredPrograms.length || carouselPaused) return;
    const id = window.setInterval(() => {
      setCurrentSlide((v) => (v + 1) % featuredPrograms.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [featuredPrograms.length, carouselPaused]);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    const targets = root.querySelectorAll('.pf-fade-up, .pf-stagger');
    if (typeof window.IntersectionObserver !== 'function') {
      targets.forEach((t) => t.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
        }),
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  // ── Carousel controls ─────────────────────────────────────────────────────

  const goToSlide = (i) => featuredPrograms.length && setCurrentSlide(i);
  const goToPrev = () =>
    featuredPrograms.length &&
    setCurrentSlide((v) => (v - 1 + featuredPrograms.length) % featuredPrograms.length);
  const goToNext = () =>
    featuredPrograms.length && setCurrentSlide((v) => (v + 1) % featuredPrograms.length);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="pf-homepage" ref={pageRef}>

      {/* ── Navbar ── */}
      <nav className={`pf-nav ${navScrolled ? 'is-scrolled' : ''}`}>
        <button className="pf-nav-brand" onClick={() => scrollToSection('home')} aria-label="Go to top">
          <span className="pf-nav-mark">PF</span>
          <span className="pf-nav-label">
            <strong>ProgramFinder</strong>
            <small>Bulacan Province</small>
          </span>
        </button>

        <div className="pf-nav-links" role="navigation" aria-label="Main navigation">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <button className="pf-nav-link" key={item.id} onClick={() => scrollToSection(item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="pf-nav-actions">
          <button className="pf-btn-ghost" onClick={() => navigate('/login/applicant')}>
            Log In
          </button>
          <button className="pf-btn-primary" onClick={() => navigate('/login/applicant')}>
            Sign Up &rarr;
          </button>
        </div>

        {/* Hamburger for mobile */}
        <button
          className="pf-nav-hamburger"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        scrollToSection={scrollToSection}
        navigate={navigate}
      />

      <div className="pf-page">

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <section className="pf-hero-wrap" id="home">
          <div className="pf-hero-grid-bg" aria-hidden="true" />
          <div className="pf-hero-blob pf-hero-blob-one" aria-hidden="true" />
          <div className="pf-hero-blob pf-hero-blob-two" aria-hidden="true" />

          <div className="pf-hero-inner">

            {/* Left copy column */}
            <div className="pf-hero-copy pf-fade-up">
              <div className="pf-hero-eyebrow">
                <span className="pf-hero-eyebrow-dot" aria-hidden="true" />
                Bulacan public service portal
              </div>

              <h1 className="pf-hero-title">
                Find Government Programs
                <span className="pf-hero-title-block">
                  You <em>May Qualify For</em>
                </span>
                <span className="pf-hero-title-block">in Bulacan</span>
              </h1>

              <p className="pf-hero-text">
                ProgramFinder Bulacan helps residents discover, check eligibility for, and apply to
                scholarships, financial aid, medical assistance, livelihood support, and other
                government programs.
              </p>

              <div className="pf-hero-actions">
                <button className="pf-btn-accent" onClick={() => navigate('/login/applicant')}>
                  Get Started &rarr;
                </button>
                <button className="pf-btn-outline" onClick={() => scrollToSection('programs')}>
                  Browse Programs
                </button>
              </div>

              {/* Category chips */}
              <div className="pf-hero-chips" role="list" aria-label="Program categories">
                {data.categories.map((cat) => (
                  <span className="pf-hero-chip" key={cat.id} role="listitem">
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: stats + carousel + panel */}
            <div className="pf-hero-lower">

              {/* Stats row */}
              <div className="pf-stats-grid pf-stagger" role="list" aria-label="Platform statistics">
                {stats.map((item) => (
                  <div className="pf-stat-card" key={item.label} role="listitem">
                    <span className="pf-stat-num">{item.value}</span>
                    <span className="pf-stat-label">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Carousel */}
              <div
                className="pf-carousel-shell"
                onMouseEnter={() => setCarouselPaused(true)}
                onMouseLeave={() => setCarouselPaused(false)}
              >
                <div className="pf-carousel-top">
                  <div>
                    <span className="pf-panel-label">Program spotlight</span>
                    <strong className="pf-carousel-kicker">Featured assistance</strong>
                  </div>
                  <div className="pf-carousel-controls" role="group" aria-label="Carousel controls">
                    <button
                      aria-label="Previous featured program"
                      className="pf-carousel-control"
                      onClick={goToPrev}
                      type="button"
                    >
                      &#8249;
                    </button>
                    <button
                      aria-label="Next featured program"
                      className="pf-carousel-control"
                      onClick={goToNext}
                      type="button"
                    >
                      &#8250;
                    </button>
                  </div>
                </div>

                {activeProgram ? (
                  <article className="pf-carousel-card" key={activeProgram.id}>
                    <div className="pf-carousel-badges">
                      <span className="pf-program-cat">{activeProgram.category}</span>
                      <span className={getProgramStatusClass(activeProgram.status)}>
                        {activeProgram.status}
                      </span>
                    </div>

                    <h3 className="pf-carousel-title">{activeProgram.title}</h3>
                    <p className="pf-carousel-text">{activeProgram.summary}</p>

                    <div className="pf-carousel-meta">
                      {[
                        { label: 'Target', value: activeProgram.sector },
                        { label: 'Deadline', value: formatPublicDate(activeProgram.deadline) },
                        { label: 'Office', value: activeProgram.office },
                        { label: 'Fit score', value: `${activeProgram.fitScore}% match` },
                      ].map(({ label, value }) => (
                        <div className="pf-carousel-meta-item" key={label}>
                          <small>{label}</small>
                          <strong>{value}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="pf-carousel-actions">
                      <button
                        className="pf-btn-accent pf-btn-carousel"
                        onClick={() => navigate('/login/applicant')}
                      >
                        Apply Now &rarr;
                      </button>
                      <button
                        className="pf-carousel-link"
                        onClick={() => scrollToSection('programs')}
                        type="button"
                      >
                        See all featured programs
                      </button>
                    </div>
                  </article>
                ) : null}

                {/* Dot indicators */}
                <div className="pf-carousel-dots" role="tablist" aria-label="Slide indicators">
                  {featuredPrograms.map((p, i) => (
                    <button
                      aria-label={`Show ${p.title}`}
                      aria-selected={i === safeSlideIndex}
                      className={`pf-carousel-dot ${i === safeSlideIndex ? 'is-active' : ''}`}
                      key={p.id}
                      onClick={() => goToSlide(i)}
                      role="tab"
                      type="button"
                    />
                  ))}
                </div>

                {/* Rail */}
                <div className="pf-carousel-rail">
                  {featuredPrograms.map((p, i) => (
                    <button
                      className={`pf-carousel-rail-item ${i === safeSlideIndex ? 'is-active' : ''}`}
                      key={`${p.id}-rail`}
                      onClick={() => goToSlide(i)}
                      type="button"
                    >
                      <strong>{p.title}</strong>
                      <small>{p.category}</small>
                    </button>
                  ))}
                </div>
              </div>

              {/* Panel highlight */}
              <div className="pf-panel-highlight pf-fade-up">
                <strong>One public entry point for residents</strong>
                <p>
                  Browse what is available first, then continue into the applicant portal for
                  personalized eligibility and tracking.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══ ABOUT ══════════════════════════════════════════════════════════ */}
        <section className="pf-section" id="about">
          <PublicSectionHeading
            eyebrow="System Overview"
            title="A single place to understand and access Bulacan programs"
            text="The homepage is designed to tell applicants what the platform does before they create an account or log in."
          />

          <div className="pf-overview-grid">
            <div className="pf-overview-list pf-stagger">
              {OVERVIEW_ITEMS.map((item) => (
                <article className="pf-overview-item" key={item.text}>
                  <span className="pf-overview-icon">
                    <OnlineIcon className="pf-icon-image" color="1e7d4d" icon={item.icon} />
                  </span>
                  <span className="pf-overview-text">{item.text}</span>
                </article>
              ))}
            </div>

            <div className="pf-note-cards pf-fade-up">
              <article className="pf-note-card">
                <span className="pf-note-badge">Before registration</span>
                <strong>Preview opportunities and deadlines</strong>
                <p>
                  Visitors can review public program information, categories, and announcements
                  before moving into the private applicant workflow.
                </p>
              </article>
              <article className="pf-note-card">
                <span className="pf-note-badge">After registration</span>
                <strong>Unlock applicant-only tools</strong>
                <p>
                  Logging in opens eligibility checking, document handling, application submission,
                  and progress tracking in one place.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ══ PROGRAMS ════════════════════════════════════════════════════════ */}
        <div className="pf-programs-wrap" id="programs">
          <div className="pf-programs-inner">
            <PublicSectionHeading
              eyebrow="Featured Programs"
              title="Currently open government assistance programs"
              text="Preview open opportunities. Full application tools and eligibility matching require an account."
            />

            <div className="pf-program-grid pf-stagger">
              {featuredPrograms.map((program) => (
                <article className="pf-program-card" key={program.id}>
                  <div className="pf-program-top">
                    <span className="pf-program-cat">{program.category}</span>
                    <span className={getProgramStatusClass(program.status)}>{program.status}</span>
                  </div>
                  <h3 className="pf-program-title">{program.title}</h3>
                  <p className="pf-program-desc">{program.summary}</p>
                  <div className="pf-program-meta">
                    <div className="pf-program-meta-item">
                      <small>Target beneficiaries</small>
                      <strong>{program.sector}</strong>
                    </div>
                    <div className="pf-program-meta-item">
                      <small>Deadline</small>
                      <strong>{formatPublicDate(program.deadline)}</strong>
                    </div>
                  </div>
                  <button
                    className="pf-program-button"
                    onClick={() => navigate('/login/applicant')}
                  >
                    View Details &rarr;
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* ══ HOW IT WORKS ════════════════════════════════════════════════════ */}
        <section className="pf-section" id="how-it-works">
          <PublicSectionHeading
            eyebrow="How It Works"
            title="A clear path from discovery to tracking"
            text="Visitors should understand the process immediately, before they ever enter the private applicant portal."
          />

          <div className="pf-steps-grid pf-stagger">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <article className="pf-step-card" key={step.number}>
                <span className="pf-step-num" aria-hidden="true">{step.number}</span>
                <h3 className="pf-step-title">{step.title}</h3>
                <p className="pf-step-text">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ══ FEATURES ════════════════════════════════════════════════════════ */}
        <div className="pf-features-wrap">
          <div className="pf-features-inner">
            <PublicSectionHeading
              eyebrow="Key Features"
              title="Why ProgramFinder Bulacan is useful"
              text="The platform removes friction between residents and the programs designed to help them."
              dark
            />

            <div className="pf-features-grid pf-stagger">
              {FEATURE_ITEMS.map((feature) => (
                <article className="pf-feature-card" key={feature.title}>
                  <span className="pf-feature-icon">
                    <OnlineIcon className="pf-icon-image" color="8fe1b9" icon={feature.icon} />
                  </span>
                  <h3 className="pf-feature-title">{feature.title}</h3>
                  <p className="pf-feature-text">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* ══ CATEGORIES ══════════════════════════════════════════════════════ */}
        <section className="pf-section">
          <PublicSectionHeading
            eyebrow="Program Categories"
            title="Browse the kinds of support available"
            text="A complete overview of categories helps you understand the range of assistance on the platform before signing in."
          />

          <div className="pf-cat-grid pf-stagger">
            {PROGRAM_CATEGORIES.map((cat) => (
              <article className="pf-cat-card" key={cat.title}>
                <strong>{cat.title}</strong>
                <p>{cat.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ══ ANNOUNCEMENTS ═══════════════════════════════════════════════════ */}
        <div className="pf-ann-wrap">
          <div className="pf-section-sm">
            <PublicSectionHeading
              eyebrow="Announcements"
              title="Latest public notices and open program reminders"
              text="Stay informed. Check back regularly for updates on open programs and official notices."
            />

            <div className="pf-ann-grid">
              {/* Latest announcements column */}
              <div>
                <h3 className="pf-ann-col-title pf-fade-up">Latest Announcements</h3>
                <div className="pf-ann-list pf-stagger">
                  {latestAnnouncements.map((ann) => (
                    <article className="pf-ann-card" key={ann.id}>
                      <div className="pf-ann-top">
                        <span className="pf-ann-title">{ann.title}</span>
                        <span className="pf-ann-date">{formatPublicDate(ann.date)}</span>
                      </div>
                      <p className="pf-ann-message">{ann.message}</p>
                      <span className="pf-ann-meta">
                        {ann.office} &middot; {ann.author}
                      </span>
                    </article>
                  ))}
                </div>
              </div>

              {/* Deadline reminders column */}
              <div>
                <h3 className="pf-ann-col-title pf-fade-up">Open Program Reminders</h3>
                <div className="pf-ann-list pf-stagger">
                  {deadlinePrograms.map((program) => (
                    <article className="pf-ann-card" key={program.id}>
                      <div className="pf-ann-top">
                        <span className="pf-ann-title">{program.title}</span>
                        <span className={getProgramStatusClass(program.status)}>
                          {program.status}
                        </span>
                      </div>
                      <p className="pf-ann-message">{program.summary}</p>
                      <span className="pf-ann-meta">
                        Deadline: {formatPublicDate(program.deadline)}
                      </span>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ FAQ ═════════════════════════════════════════════════════════════ */}
        <section className="pf-section" id="faq">
          <PublicSectionHeading
            eyebrow="FAQ"
            title="Common questions from first-time visitors"
            text="The public page answers the basics before a resident decides to continue."
          />

          <div className="pf-faq-list" role="list">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <article
                  className={`pf-faq-item ${isOpen ? 'open' : ''}`}
                  key={item.question}
                  role="listitem"
                >
                  <button
                    aria-controls={`faq-answer-${index}`}
                    aria-expanded={isOpen}
                    className="pf-faq-question"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  >
                    <span>{item.question}</span>
                    <span className="pf-faq-chevron" aria-hidden="true">
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </button>
                  <div
                    className="pf-faq-answer"
                    id={`faq-answer-${index}`}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                  >
                    {item.answer}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ══ CONTACT ═════════════════════════════════════════════════════════ */}
        <section className="pf-section-sm" id="contact">
          <PublicSectionHeading
            eyebrow="Contact"
            title="Need help before you create an account?"
            text="Use the public information here first, then continue into the applicant portal for guided support."
          />

          <div className="pf-contact-grid pf-stagger">
            <article className="pf-contact-card">
              <span className="pf-contact-badge">ProgramFinder Bulacan</span>
              <strong>Provincial Program Management Office</strong>
              <p>Bulacan Province</p>
              <small>Support hours: Mon–Fri, 8:00 AM – 5:00 PM</small>
            </article>

            <article className="pf-contact-card">
              <span className="pf-contact-badge">Help / Support</span>
              <strong>Start with the applicant portal</strong>
              <p>
                Log in to review requirements, receive announcements, and track your program
                applications in one place.
              </p>
              <button
                className="pf-btn-accent pf-btn-contact"
                onClick={() => navigate('/login/applicant')}
              >
                Applicant Log In &rarr;
              </button>
            </article>

            <article className="pf-contact-card">
              <span className="pf-contact-badge">Participating offices</span>
              <strong>Public offices on the platform</strong>
              <div className="pf-office-chips">
                {data.offices.map((office) => (
                  <span className="pf-office-chip" key={office.id}>
                    {office.name}
                  </span>
                ))}
              </div>
            </article>
          </div>
        </section>

        {/* ══ CTA BANNER ══════════════════════════════════════════════════════ */}
        <div className="pf-cta-wrap">
          <div className="pf-cta-inner pf-fade-up">
            <span className="pf-sec-eyebrow">Start Here</span>
            <h2 className="pf-sec-title">
              Ready to find programs designed for Bulacan residents?
            </h2>
            <p className="pf-sec-text">
              Create an account or log in to access personalized eligibility matching, guided
              requirements, and real-time application tracking.
            </p>
            <div className="pf-cta-actions">
              <button className="pf-btn-white" onClick={() => navigate('/login/applicant')}>
                Sign Up Free &rarr;
              </button>
              <button
                className="pf-btn-white-outline"
                onClick={() => navigate('/login/applicant')}
              >
                I Have an Account
              </button>
            </div>
          </div>
        </div>

        {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
        <footer className="pf-footer">
          <div className="pf-footer-inner">
            <div className="pf-footer-grid">
              <div>
                <div className="pf-footer-brand">
                  <span className="pf-footer-mark">PF</span>
                  <span className="pf-footer-name">ProgramFinder Bulacan</span>
                </div>
                <p className="pf-footer-desc">
                  A public-facing gateway for residents to discover available programs, review
                  eligibility, and continue into a guided applicant workflow.
                </p>
              </div>

              <div>
                <h3 className="pf-footer-heading">Quick Links</h3>
                <nav className="pf-footer-links" aria-label="Footer navigation">
                  {[
                    { label: 'About', id: 'about' },
                    { label: 'Programs', id: 'programs' },
                    { label: 'FAQ', id: 'faq' },
                    { label: 'Contact', id: 'contact' },
                  ].map(({ label, id }) => (
                    <button
                      className="pf-footer-link"
                      key={id}
                      onClick={() => scrollToSection(id)}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    className="pf-footer-link"
                    onClick={() => navigate('/login/applicant')}
                  >
                    Applicant Portal
                  </button>
                </nav>
              </div>

              <div>
                <h3 className="pf-footer-heading">Contact</h3>
                <address className="pf-footer-desc" style={{ fontStyle: 'normal' }}>
                  Provincial Program Management Office
                  <br />
                  Bulacan Province
                </address>
                <p className="pf-footer-desc">Mon–Fri, 8:00 AM – 5:00 PM</p>
              </div>
            </div>

            <div className="pf-footer-bottom">
              <span className="pf-footer-copy">
                &copy; {new Date().getFullYear()} ProgramFinder Bulacan. All rights reserved.
              </span>
              <span className="pf-footer-copy">Built for Bulacan residents.</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}

// ─── App Root ────────────────────────────────────────────────────────────────

function App() {
  const {
    path,
    session,
    data,
    toast,
    navigate,
    login,
    loginToStaffPortal,
    logout,
    reset,
    roleFromPath,
    sectionFromPath,
    loginRoleFromPath,
    isStaffLoginRoute,
    actions,
  } = usePrototypeApp();

  let screen = null;
  const unreadNotificationCount = session
    ? data.notifications.filter((notification) => notification.recipient === session.email && notification.unread).length
    : 0;

  if (path === '/') {
    screen = <PublicLandingPage data={data} navigate={navigate} />;
  } else if (isStaffLoginRoute) {
    screen = <PersonnelLoginPage navigate={navigate} onLogin={loginToStaffPortal} />;
  } else if (loginRoleFromPath) {
    screen = <RoleLoginPage role={loginRoleFromPath} navigate={navigate} onLogin={login} />;
  } else if (session && roleFromPath && SCREEN_REGISTRY[roleFromPath]) {
    const screenConfig = SCREEN_REGISTRY[roleFromPath][sectionFromPath];
    const ScreenComponent = screenConfig?.component;

    screen = (
      <DashboardLayout
        role={roleFromPath}
        session={session}
        section={sectionFromPath}
        navItems={MODULE_REGISTRY[roleFromPath]}
        heading={screenConfig?.heading}
        subheading={screenConfig?.subheading}
        navigate={navigate}
        onLogout={logout}
        notificationCount={unreadNotificationCount}
        onOpenNotifications={
          ['applicant', 'personnel'].includes(roleFromPath)
            ? () => {
                actions.markNotificationsRead();
                navigate(`/${roleFromPath}/notifications`);
              }
            : null
        }
        hideHeader={['admin', 'personnel'].includes(roleFromPath)}
        onReset={reset}
      >
        {ScreenComponent ? (
          <ScreenComponent
            session={session}
            data={data}
            navigate={navigate}
            actions={actions}
          />
        ) : null}
      </DashboardLayout>
    );
  }

  return (
    <div className={`app-shell ${path === '/' ? 'app-shell-public-home' : ''}`}>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      {screen}
      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    </div>
  );
}

export default App;
