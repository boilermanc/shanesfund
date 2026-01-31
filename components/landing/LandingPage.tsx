import React, { useRef, useState, useEffect } from 'react';
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
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';
import AboutUs from './AboutUs';
import ContactPage from './ContactPage';

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

  // Render legal pages
  if (currentPage === 'terms') {
    return <TermsOfService onBack={() => navigateTo('home')} />;
  }

  if (currentPage === 'privacy') {
    return <PrivacyPolicy onBack={() => navigateTo('home')} />;
  }

  if (currentPage === 'about') {
    return <AboutUs onBack={() => navigateTo('home')} />;
  }

  if (currentPage === 'contact') {
    return <ContactPage onBack={() => navigateTo('home')} />;
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
