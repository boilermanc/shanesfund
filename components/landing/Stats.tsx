import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, DollarSign, Award, Ticket } from 'lucide-react';

interface StatItemProps {
  icon: React.ReactNode;
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  delay: number;
}

const StatItem: React.FC<StatItemProps> = ({ icon, value, suffix, prefix = '', label, delay }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000;
    const steps = 60;
    const stepTime = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current++;
      const progress = current / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * value));

      if (current >= steps) {
        setCount(value);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay }}
      className="text-center"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#006D77]/10 text-[#006D77] mb-3 sm:mb-4">
        {icon}
      </div>
      <div className="shane-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#006D77] mb-1 sm:mb-2">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs sm:text-sm font-bold text-[#006D77]/60 uppercase tracking-wider">
        {label}
      </div>
    </motion.div>
  );
};

const Stats: React.FC = () => {
  const stats = [
    {
      icon: <Users size={24} />,
      value: 2500,
      suffix: '+',
      label: 'Members',
      delay: 0
    },
    {
      icon: <DollarSign size={24} />,
      value: 127,
      prefix: '$',
      suffix: 'K+',
      label: 'Tracked',
      delay: 0.1
    },
    {
      icon: <Award size={24} />,
      value: 450,
      suffix: '+',
      label: 'Pools',
      delay: 0.2
    },
    {
      icon: <Ticket size={24} />,
      value: 12,
      suffix: 'K+',
      label: 'Tickets Scanned',
      delay: 0.3
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          {stats.map((stat, index) => (
            <StatItem key={index} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
