import React from 'react';
import { motion } from 'framer-motion';
import { Camera, CheckCircle, Eye, Wallet, Bell, Shield } from 'lucide-react';

const features = [
  {
    icon: <Camera size={28} />,
    title: 'Ticket Scanning',
    description: 'Snap a photo of your lottery ticket and watch the numbers auto-populate. Our OCR technology does the heavy lifting.',
    color: 'bg-[#006D77]'
  },
  {
    icon: <CheckCircle size={28} />,
    title: 'Auto Win Checking',
    description: 'We automatically check your numbers against the latest results after every draw. No more manual checking.',
    color: 'bg-[#83C5BE]'
  },
  {
    icon: <Eye size={28} />,
    title: 'Transparent Tracking',
    description: 'Every member sees every ticket, every number, every draw. Complete transparency builds trust.',
    color: 'bg-[#E29578]'
  },
  {
    icon: <Wallet size={28} />,
    title: 'Contribution Tracking',
    description: 'Know exactly who\'s paid and who owes. No awkward conversations or confusion about contributions.',
    color: 'bg-[#FFDDD2]'
  },
  {
    icon: <Bell size={28} />,
    title: 'Push Notifications',
    description: 'Get alerted for upcoming draws, when tickets are added, and most importantly - when you win!',
    color: 'bg-[#006D77]'
  },
  {
    icon: <Shield size={28} />,
    title: 'Secure & Private',
    description: 'Your data is encrypted and protected. We never share your information with third parties.',
    color: 'bg-[#83C5BE]'
  }
];

const Features: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 md:py-28 bg-[#F2E9D4]">
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
            Everything You Need
          </h2>
          <p className="text-base sm:text-lg text-[#006D77]/70 font-medium max-w-2xl mx-auto">
            Powerful features designed to make lottery pool management a breeze
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-lg shadow-[#006D77]/5 hover:shadow-xl hover:shadow-[#006D77]/10 transition-shadow"
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center text-white mb-5`}>
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-lg sm:text-xl font-black text-[#006D77] mb-2 sm:mb-3">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-[#006D77]/60 font-medium leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
