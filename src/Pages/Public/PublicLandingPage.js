import { useEffect, useRef, useState } from 'react';
import {
  FEATURE_ITEMS,
  FAQ_ITEMS,
  HOW_IT_WORKS_STEPS,
  OVERVIEW_ITEMS,
  PROGRAM_CATEGORIES,
  PUBLIC_NAV_ITEMS,
} from 'Data/Public/public-content';
import { fetchOfficialBulacanNews, OFFICIAL_PUBLIC_SOURCES } from 'Services/Public/official-news';
import { getProgramPriority } from 'Services/Public/public-utils';
import { PublicAnnouncementsSection } from 'Components/Public/PublicAnnouncementsSection';
import { PublicCategoriesSection } from 'Components/Public/PublicCategoriesSection';
import { PublicContactSection } from 'Components/Public/PublicContactSection';
import { PublicFaqSection } from 'Components/Public/PublicFaqSection';
import { PublicFeaturesSection } from 'Components/Public/PublicFeaturesSection';
import { PublicFooter } from 'Components/Public/PublicFooter';
import { PublicHeroSection } from 'Components/Public/PublicHeroSection';
import { PublicHowItWorksSection } from 'Components/Public/PublicHowItWorksSection';
import { PublicNavigation } from 'Components/Public/PublicNavigation';
import { PublicOverviewSection } from 'Components/Public/PublicOverviewSection';
import { PublicProgramsSection } from 'Components/Public/PublicProgramsSection';

const OFFICIAL_PROGRAM_REFERENCE_BY_CATEGORY = {
  Education: {
    href: 'https://bulacan.gov.ph/pgb-partners-with-landbank-to-facilitate-scholarship-grants-for-over-2000-scholars/',
    label: 'Open official scholarship reference',
    source: 'Provincial Government of Bulacan',
  },
  Livelihood: {
    href: 'https://bulacan.gov.ph/46-bulakenyo-fisherfolks-receive-livelihood-support-from-pgb-bfar/',
    label: 'Open official livelihood reference',
    source: 'Provincial Government of Bulacan',
  },
  Health: {
    href: 'https://bulacan.gov.ph/health/',
    label: 'Open official health services page',
    source: 'Provincial Government of Bulacan',
  },
  Business: {
    href: 'https://bulacan.gov.ph/go-asenso-negosyo-caravan-boosts-bulakenyo-entrepreneurs-in-guiguinto-town/',
    label: 'Open official enterprise reference',
    source: 'Provincial Government of Bulacan',
  },
  default: {
    href: 'https://bulacan.gov.ph/',
    label: 'Open official provincial website',
    source: 'Provincial Government of Bulacan',
  },
};

export function PublicLandingPage({ data, navigate }) {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [officialNewsItems, setOfficialNewsItems] = useState([]);
  const [officialNewsState, setOfficialNewsState] = useState('idle');
  const pageRef = useRef(null);

  const featuredPrograms = [...data.programs]
    .sort((a, b) => {
      const priorityDifference = getProgramPriority(a.status) - getProgramPriority(b.status);
      return priorityDifference !== 0 ? priorityDifference : b.fitScore - a.fitScore;
    })
    .slice(0, 4);

  const heroHighlights = featuredPrograms.map((program) => ({
    ...program,
    officialReference:
      OFFICIAL_PROGRAM_REFERENCE_BY_CATEGORY[program.category] ||
      OFFICIAL_PROGRAM_REFERENCE_BY_CATEGORY.default,
  }));

  const deadlinePrograms = [...data.programs]
    .filter((program) => ['Open', 'Upcoming'].includes(program.status))
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  const fallbackAnnouncements = [...data.announcements]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  const stats = [
    {
      value: data.programs.filter((program) => program.status === 'Open').length,
      label: 'Open Programs',
    },
    { value: data.offices.length, label: 'Offices' },
    { value: data.announcements.length, label: 'Notices' },
    { value: data.applications.length, label: 'Tracked Apps' },
  ];

  const newsItems = officialNewsItems.length
    ? officialNewsItems
    : fallbackAnnouncements.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        summary: announcement.message,
        publishedAt: announcement.date,
        href: '',
        imageUrl: '',
        sourceName: announcement.office,
        sourceLabel: 'Local Notice',
      }));

  const scrollToSection = (sectionId) => {
    const sectionElement = document.getElementById(sectionId);

    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navigateToApplicantPortal = () => navigate('/login/applicant');
  const navigateToApplicantSignup = () => navigate('/login/applicant/signup');

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 20);

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const rootElement = pageRef.current;

    if (!rootElement) {
      return undefined;
    }

    const targets = rootElement.querySelectorAll('.pf-fade-up, .pf-stagger');

    if (typeof window.IntersectionObserver !== 'function') {
      targets.forEach((target) => target.classList.add('visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    );

    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setOfficialNewsState('loading');
    fetchOfficialBulacanNews({ signal: controller.signal })
      .then((items) => {
        setOfficialNewsItems(items);
        setOfficialNewsState(items.length ? 'ready' : 'empty');
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          return;
        }

        console.warn('Unable to load official Bulacan news.', error);
        setOfficialNewsState('error');
      });

    return () => controller.abort();
  }, []);

  const toggleFaq = (index) => {
    setOpenFaqIndex((currentIndex) => (currentIndex === index ? null : index));
  };

  return (
    <div className="pf-homepage" ref={pageRef}>
      <PublicNavigation
        mobileMenuOpen={mobileMenuOpen}
        navItems={PUBLIC_NAV_ITEMS}
        navScrolled={navScrolled}
        onCloseMenu={() => setMobileMenuOpen(false)}
        onOpenApplicantPortal={navigateToApplicantPortal}
        onOpenApplicantSignup={navigateToApplicantSignup}
        onOpenMenu={() => setMobileMenuOpen(true)}
        onSelectSection={scrollToSection}
      />

      <div className="pf-page">
        <PublicHeroSection
          categories={data.categories}
          highlightPrograms={heroHighlights}
          onOpenApplicantPortal={navigateToApplicantPortal}
          onSelectSection={scrollToSection}
          stats={stats}
        />
        <PublicAnnouncementsSection
          deadlinePrograms={deadlinePrograms}
          newsItems={newsItems}
          officialNewsState={officialNewsState}
          officialSources={OFFICIAL_PUBLIC_SOURCES}
        />
        <PublicOverviewSection overviewItems={OVERVIEW_ITEMS} />
        <PublicProgramsSection
          featuredPrograms={featuredPrograms}
          onOpenApplicantPortal={navigateToApplicantPortal}
        />
        <PublicHowItWorksSection steps={HOW_IT_WORKS_STEPS} />
        <PublicFeaturesSection features={FEATURE_ITEMS} />
        <PublicCategoriesSection categories={PROGRAM_CATEGORIES} />
        <PublicFaqSection
          faqItems={FAQ_ITEMS}
          onToggleFaq={toggleFaq}
          openFaqIndex={openFaqIndex}
        />
        <PublicContactSection
          offices={data.offices}
          onOpenApplicantPortal={navigateToApplicantPortal}
        />
        <PublicFooter
          onOpenApplicantPortal={navigateToApplicantPortal}
          onSelectSection={scrollToSection}
        />
      </div>
    </div>
  );
}

export default PublicLandingPage;
