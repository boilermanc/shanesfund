import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onToggle, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border-b border-[#006D77]/10 last:border-b-0"
    >
      <button
        onClick={onToggle}
        className="w-full py-5 sm:py-6 flex items-center justify-between text-left group"
      >
        <span className="text-base sm:text-lg font-bold text-[#006D77] pr-4 group-hover:text-[#006D77]/80 transition-colors">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown
            size={20}
            className={`transition-colors ${isOpen ? 'text-[#E29578]' : 'text-[#83C5BE]'}`}
          />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 sm:pb-6 text-sm sm:text-base text-[#006D77]/70 font-medium leading-relaxed pr-8">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Is this legal?',
      answer: 'Yes! Shane\'s Retirement Fund is a management tool for lottery pools, not a gambling operator. We don\'t sell tickets or handle money for lottery purchases. We simply help you organize and track your pool\'s activities transparently.'
    },
    {
      question: 'Do you take a cut of winnings?',
      answer: 'Absolutely not. We\'re a subscription-based service. When your pool wins, 100% of the winnings go to you and your pool members. We never touch your prize money.'
    },
    {
      question: 'How does ticket scanning work?',
      answer: 'Simply open the app and take a photo of your lottery ticket. Our OCR (Optical Character Recognition) technology automatically reads the numbers and adds them to your pool. It works with most major lottery tickets including Powerball and Mega Millions.'
    },
    {
      question: 'What lotteries do you support?',
      answer: 'At launch, we\'ll support Powerball and Mega Millions - the two biggest lottery games in the US. We\'re planning to add more state lotteries and games based on user demand.'
    },
    {
      question: 'How do I invite people to my pool?',
      answer: 'After creating a pool, you\'ll get a unique invite link that you can share via text, email, or any messaging app. When someone clicks the link, they can join your pool with just a few taps. No complicated signup process required.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Security is our top priority. We use industry-standard encryption for all data transmission and storage. Your personal information is never sold or shared with third parties. We\'re also SOC 2 compliant and undergo regular security audits.'
    }
  ];

  return (
    <section id="faq" className="py-16 sm:py-20 md:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#006D77]/10 text-[#006D77] mb-4">
            <HelpCircle size={28} />
          </div>
          <h2 className="shane-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#006D77] mb-3 sm:mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-[#006D77]/70 font-medium">
            Got questions? We've got answers.
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="bg-[#EDF6F9] rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
