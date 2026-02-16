import React, { Suspense, useRef, useState, useEffect } from 'react';
import Header from './Header';
import Hero from './Hero';
import Stats from './Stats';
import HowItWorks from './HowItWorks';
import VideoSection from './VideoSection';
import Features from './Features';
import Pricing from './Pricing';
import FAQ from './FAQ';
import FinalCTA from './FinalCTA';
import Footer from './Footer';

const TermsOfService = React.lazy(() => import('./TermsOfService'));
const PrivacyPolicy = React.lazy(() => import('./PrivacyPolicy'));
const AboutUs = React.lazy(() => import('./AboutUs'));
const ContactPage = React.lazy(() => import('./ContactPage'));

type PageType = 'home' | 'terms' | 'privacy' | 'about' | 'contact';

const LandingPage: React.FC = () => {
  const signupRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState<PageType>('home');

  // Handle URL-based routing
  useEffect(() => {
    const handleRoute = () => {
      const path = window.location.pathname;
      if (path === '/terms') {
        setCurrentPage('terms');
      } else if (path === '/privacy') {
        setCurrentPage('privacy');
      } else if (path === '/about') {
        setCurrentPage('about');
      } else if (path === '/contact') {
        setCurrentPage('contact');
      } else {
        setCurrentPage('home');
      }
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  // Update document.title based on current page
  useEffect(() => {
    const titles: Record<PageType, string> = {
      home: "Shane's Retirement Fund — Pool Your Luck",
      terms: "Terms of Service — Shane's Retirement Fund",
      privacy: "Privacy Policy — Shane's Retirement Fund",
      about: "About Us — Shane's Retirement Fund",
      contact: "Contact — Shane's Retirement Fund",
    };
    document.title = titles[currentPage];
  }, [currentPage]);

  const navigateTo = (page: PageType) => {
    const path = page === 'home' ? '/' : `/${page}`;
    window.history.pushState({}, '', path);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const scrollToSignup = () => {
    const signupSection = document.getElementById('signup');
    if (signupSection) {
      signupSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Render sub-pages (lazy-loaded)
  if (currentPage !== 'home') {
    const SubPage = {
      terms: TermsOfService,
      privacy: PrivacyPolicy,
      about: AboutUs,
      contact: ContactPage,
    }[currentPage];

    return (
      <Suspense fallback={
        <div className="min-h-screen bg-[#EDF6F9] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#006D77] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <SubPage onBack={() => navigateTo('home')} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDF6F9]">
      <Header onScrollToSignup={scrollToSignup} />
      <main>
        <Hero />
        <VideoSection />
        <Stats />
        <HowItWorks />
        <Features />
        <Pricing onScrollToSignup={scrollToSignup} />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
