import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const links = [
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Terms of Use', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' }
  ];

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.history.pushState({}, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-[#F2E9D4] py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8">
          {/* Logo & Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <a
              href="/"
              onClick={(e) => handleNavigation(e, '/')}
            >
              <img
                src="/logo.png"
                alt="Shane's Retirement Fund"
                className="h-12 w-auto"
              />
            </a>
            <span className="hidden sm:block text-[#006D77]/30">|</span>
            <p className="text-sm text-[#006D77]/60 font-medium">
              © {currentYear} Sweetwater Technology
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavigation(e, link.href)}
                className="text-sm font-medium text-[#006D77]/60 hover:text-[#006D77] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8 pt-6 border-t border-[#006D77]/10 text-center"
        >
          <p className="text-xs text-[#006D77]/40 font-medium flex items-center justify-center gap-1">
            Made with <Heart size={12} className="text-[#E29578]" fill="#E29578" /> in Texas
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
