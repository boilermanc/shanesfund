import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

interface PricingTierProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  delay: number;
  onGetStarted: () => void;
}

const PricingTier: React.FC<PricingTierProps> = ({
  name,
  price,
  period,
  description,
  features,
  isPopular,
  delay,
  onGetStarted
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay }}
      className={`relative rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 ${
        isPopular
          ? 'bg-[#006D77] text-white shadow-2xl shadow-[#006D77]/30 scale-[1.02] sm:scale-105'
          : 'bg-white shadow-lg shadow-[#006D77]/5'
      }`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#E29578] text-white text-xs sm:text-sm font-bold shadow-lg">
            <Sparkles size={14} />
            Most Popular
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h3 className={`text-lg sm:text-xl font-black mb-2 ${isPopular ? 'text-white' : 'text-[#006D77]'}`}>
          {name}
        </h3>
        <p className={`text-sm font-medium ${isPopular ? 'text-white/70' : 'text-[#006D77]/60'}`}>
          {description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-baseline gap-1">
          <span className={`shane-serif text-4xl sm:text-5xl font-black ${isPopular ? 'text-white' : 'text-[#006D77]'}`}>
            {price}
          </span>
          {period && (
            <span className={`text-sm font-medium ${isPopular ? 'text-white/60' : 'text-[#006D77]/50'}`}>
              {period}
            </span>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              isPopular ? 'bg-[#83C5BE]' : 'bg-[#006D77]/10'
            }`}>
              <Check size={12} className={isPopular ? 'text-white' : 'text-[#006D77]'} strokeWidth={3} />
            </div>
            <span className={`text-sm font-medium ${isPopular ? 'text-white/90' : 'text-[#006D77]/70'}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={onGetStarted}
        className={`w-full py-3 sm:py-4 rounded-[1rem] sm:rounded-[1.2rem] font-bold text-sm sm:text-base transition-all active:scale-[0.98] ${
          isPopular
            ? 'bg-white text-[#006D77] hover:bg-white/90'
            : 'bg-[#006D77] text-white hover:bg-[#006D77]/90'
        }`}
      >
        Get Started
      </button>
    </motion.div>
  );
};

interface PricingProps {
  onScrollToSignup: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onScrollToSignup }) => {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: '',
      description: 'Perfect for getting started',
      features: [
        '1 active pool',
        'Up to 10 members',
        'Basic ticket tracking',
        'Manual win checking',
        'Email support'
      ]
    },
    {
      name: 'Premium',
      price: '$4.99',
      period: '/mo',
      description: 'For serious pool managers',
      features: [
        'Up to 5 active pools',
        'Up to 50 members per pool',
        'OCR ticket scanning',
        'Auto win checking',
        'Recurring pool schedules',
        'Priority email support'
      ],
      isPopular: true
    },
    {
      name: 'Pro',
      price: '$9.99',
      period: '/mo',
      description: 'For power users and organizations',
      features: [
        'Unlimited pools',
        'Unlimited members',
        'Advanced analytics',
        'Export reports',
        'API access',
        'Priority support'
      ]
    }
  ];

  return (
    <section id="pricing" className="py-16 sm:py-20 md:py-28 bg-[#EDF6F9]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="shane-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#006D77] mb-3 sm:mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-base sm:text-lg text-[#006D77]/70 font-medium max-w-2xl mx-auto">
            Start free, upgrade when you need more power. No hidden fees, ever.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {tiers.map((tier, index) => (
            <PricingTier
              key={tier.name}
              {...tier}
              delay={index * 0.1}
              onGetStarted={onScrollToSignup}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
