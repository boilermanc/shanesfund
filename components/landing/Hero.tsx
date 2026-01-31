import React from 'react';
import { motion } from 'framer-motion';
import { Users, Sparkles } from 'lucide-react';
import PreSignupForm from '../PreSignupForm';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 sm:pt-24 pb-12 sm:pb-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#EDF6F9] via-[#FFDDD2]/20 to-[#EDF6F9]" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#83C5BE]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#E29578]/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFDDD2]/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#006D77]/10 text-[#006D77] font-bold text-xs sm:text-sm mb-6 sm:mb-8"
          >
            <Sparkles size={16} />
            Better odds together
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="shane-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[#006D77] leading-[1.1] tracking-tight mb-4 sm:mb-6"
          >
            Pool Together.
            <br />
            <span className="text-[#E29578]">Win Together.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-[#006D77]/70 font-medium leading-relaxed mb-8 sm:mb-10 max-w-2xl mx-auto px-4"
          >
            The easiest way to manage lottery pools with friends, family, and coworkers.
            No spreadsheets. No drama. Just better odds.
          </motion.p>

          {/* Signup Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <PreSignupForm variant="light" />
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-[#006D77]/60 font-medium"
          >
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#83C5BE]" />
              <span>Free to join</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-[#83C5BE]" />
            <span>No credit card required</span>
            <div className="w-1 h-1 rounded-full bg-[#83C5BE] hidden sm:block" />
            <span className="hidden sm:block">Launch coming soon</span>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:block"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-[#006D77]/30 flex justify-center pt-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#006D77]/50" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
