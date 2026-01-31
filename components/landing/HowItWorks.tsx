import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users, Camera, Trophy } from 'lucide-react';

const steps = [
  {
    icon: <UserPlus size={28} />,
    number: '01',
    title: 'Create Your Pool',
    description: 'Start a pool in seconds. Give it a name and set your preferences.',
    color: 'from-[#006D77] to-[#83C5BE]'
  },
  {
    icon: <Users size={28} />,
    number: '02',
    title: 'Add Members',
    description: 'Share a simple invite link. Friends and family join with one tap.',
    color: 'from-[#83C5BE] to-[#FFDDD2]'
  },
  {
    icon: <Camera size={28} />,
    number: '03',
    title: 'Scan Tickets',
    description: 'Snap a photo of your tickets. OCR automatically captures numbers.',
    color: 'from-[#FFDDD2] to-[#E29578]'
  },
  {
    icon: <Trophy size={28} />,
    number: '04',
    title: 'Win Together',
    description: 'Auto-check results after every draw. We calculate everyone\'s share.',
    color: 'from-[#E29578] to-[#006D77]'
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 md:py-28 bg-[#EDF6F9]">
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
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-[#006D77]/70 font-medium max-w-2xl mx-auto">
            Managing a lottery pool has never been easier. Four simple steps to better odds.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connection Line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#83C5BE]/50 to-transparent" />
              )}

              <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-lg shadow-[#006D77]/5 h-full">
                {/* Number Badge */}
                <div className="flex items-center gap-4 mb-4 sm:mb-5">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white`}>
                    {step.icon}
                  </div>
                  <span className="text-4xl sm:text-5xl font-black text-[#006D77]/10">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg sm:text-xl font-black text-[#006D77] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm sm:text-base text-[#006D77]/60 font-medium leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
