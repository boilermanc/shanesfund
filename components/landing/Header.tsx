import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import LoginModal from '../LoginModal';

interface HeaderProps {
  onScrollToSignup: () => void;
}

const Header: React.FC<HeaderProps> = ({ onScrollToSignup }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If section doesn't exist, navigate to home page with hash
      window.location.href = `/#${id}`;
    }
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Pricing', id: 'pricing' },
    { label: 'FAQ', id: 'faq' }
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-lg shadow-lg shadow-[#006D77]/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shadow-md flex-shrink-0">
                <img
                  src="/shane-main.png"
                  alt="Shane's Retirement Fund"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="shane-serif text-base sm:text-lg font-black text-[#006D77] hidden sm:block">
                Shane's Retirement Fund
              </span>
              <span className="shane-serif text-base font-black text-[#006D77] sm:hidden">
                SRF
              </span>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-sm font-bold text-[#006D77]/70 hover:text-[#006D77] transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setIsLoginOpen(true)}
                className="px-5 py-2.5 rounded-full text-sm font-bold text-[#006D77] hover:bg-[#006D77]/10 transition-colors"
              >
                Login
              </button>
              <button
                onClick={onScrollToSignup}
                className="px-5 py-2.5 rounded-full text-sm font-bold bg-[#E29578] text-white shadow-lg shadow-[#E29578]/20 hover:shadow-xl hover:shadow-[#E29578]/30 transition-all active:scale-[0.98]"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#006D77]"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-[#006D77]/10"
            >
              <div className="px-4 py-4 space-y-2">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className="block w-full text-left px-4 py-3 rounded-xl text-[#006D77] font-bold hover:bg-[#006D77]/5 transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => {
                      setIsLoginOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 py-3 rounded-xl text-[#006D77] font-bold bg-[#006D77]/10"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      onScrollToSignup();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 py-3 rounded-xl bg-[#E29578] text-white font-bold"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
};

export default Header;
