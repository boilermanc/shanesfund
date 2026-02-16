import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Clock, ChevronDown, CheckCircle, MessageSquare } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { submitContactMessage } from '../../services/contact';

interface ContactPageProps {
  onBack: () => void;
}

interface FAQItem {
  category: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    category: 'Getting Started',
    question: 'How do I create a lottery pool?',
    answer: 'After signing up, tap "Create Pool" from the dashboard. Give your pool a name, set your contribution amount, and invite friends via a unique share link. It takes less than a minute to get started!'
  },
  {
    category: 'Getting Started',
    question: 'How do I invite people to my pool?',
    answer: 'Once your pool is created, you\'ll get a unique invite link. Share it via text, email, or any messaging app. When someone clicks the link, they can join your pool instantly—no complicated signup required.'
  },
  {
    category: 'Tickets & Scanning',
    question: 'How does ticket scanning work?',
    answer: 'Open the app, tap the scan icon, and take a photo of your lottery ticket. Our OCR technology reads the numbers automatically and adds them to your pool. Works with Powerball, Mega Millions, and most major lotteries.'
  },
  {
    category: 'Winnings & Money',
    question: 'Do you take a cut of winnings?',
    answer: 'Absolutely not! We\'re a subscription-based service. When your pool wins, 100% of the winnings go to you and your members. We never touch your prize money.'
  },
  {
    category: 'Winnings & Money',
    question: 'How are winnings distributed?',
    answer: 'Winnings are split based on each member\'s contribution percentage. If you contributed 20% of the pool, you get 20% of any winnings. The app tracks everything transparently so there\'s never any confusion.'
  },
  {
    category: 'Security & Legal',
    question: 'Is Shane\'s Retirement Fund legal?',
    answer: 'Yes! We\'re a pool management tool, not a gambling operator. We don\'t sell tickets or handle lottery purchases. We simply help you organize and track your pool\'s activities transparently.'
  },
  {
    category: 'Security & Legal',
    question: 'Is my data secure?',
    answer: 'Security is our top priority. We use industry-standard encryption for all data transmission and storage. Your personal information is never sold or shared with third parties.'
  }
];

const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-[#006D77] mb-2">Frequently Asked Questions</h2>
        <p className="text-[#006D77]/70 font-medium text-sm sm:text-base">Quick answers to common questions.</p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => (
          <div
            key={idx}
            className={`group bg-white rounded-[1.5rem] sm:rounded-[2rem] border-2 transition-all duration-300 ${
              openIndex === idx
                ? 'border-[#006D77]/30 shadow-xl shadow-[#006D77]/10'
                : 'border-[#83C5BE]/30 hover:border-[#006D77]/20 shadow-sm'
            }`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between px-5 sm:px-8 py-4 sm:py-6 text-left"
            >
              <div className="space-y-1 pr-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#83C5BE]">
                  {faq.category}
                </span>
                <p className={`text-sm sm:text-base font-bold transition-colors ${
                  openIndex === idx ? 'text-[#006D77]' : 'text-[#006D77]/80'
                }`}>
                  {faq.question}
                </p>
              </div>
              <motion.div
                animate={{ rotate: openIndex === idx ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  openIndex === idx
                    ? 'bg-[#006D77] text-white'
                    : 'bg-[#EDF6F9] text-[#006D77]/60'
                }`}
              >
                <ChevronDown size={18} />
              </motion.div>
            </button>
            <AnimatePresence>
              {openIndex === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 sm:px-8 pb-5 sm:pb-8 text-sm sm:text-base text-[#006D77]/70 leading-relaxed border-t border-[#006D77]/10 pt-4 mt-2">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const SupportForm: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Question',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const { error } = await submitContactMessage(formData);

    if (error) {
      setSubmitError(error);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#006D77]/5 border-2 border-[#006D77]/20 p-8 sm:p-12 rounded-[2rem] sm:rounded-[2.5rem] text-center space-y-4"
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#006D77] text-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg shadow-[#006D77]/30">
          <CheckCircle size={28} />
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-[#006D77]">Message Received!</h3>
        <p className="text-sm sm:text-base text-[#006D77]/70 max-w-md mx-auto">
          Thanks for reaching out, <span className="font-bold">{formData.name}</span>.
          We'll get back to you at <span className="font-bold">{formData.email}</span> within 24 hours.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setFormData({ name: '', email: '', subject: 'General Question', message: '' });
          }}
          className="text-[#006D77] font-bold hover:underline"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl border-2 border-[#83C5BE]/20">
      <div className="mb-8 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-black text-[#006D77] mb-2">Send us a Message</h2>
        <p className="text-[#006D77]/70 font-medium text-sm sm:text-base">Have a specific question? Fill out the form below.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
          <div className="space-y-2">
            <label htmlFor="contact-name" className="text-sm font-bold text-[#006D77]">Full Name</label>
            <input
              id="contact-name"
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-[#EDF6F9] border-2 border-[#83C5BE]/30 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 focus:ring-4 focus:ring-[#006D77]/20 focus:border-[#006D77] transition-all outline-none text-[#006D77] placeholder:text-[#006D77]/40"
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="contact-email" className="text-sm font-bold text-[#006D77]">Email Address</label>
            <input
              id="contact-email"
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-[#EDF6F9] border-2 border-[#83C5BE]/30 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 focus:ring-4 focus:ring-[#006D77]/20 focus:border-[#006D77] transition-all outline-none text-[#006D77] placeholder:text-[#006D77]/40"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="contact-subject" className="text-sm font-bold text-[#006D77]">Subject</label>
          <select
            id="contact-subject"
            value={formData.subject}
            onChange={(e) => setFormData({...formData, subject: e.target.value})}
            className="w-full bg-[#EDF6F9] border-2 border-[#83C5BE]/30 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 focus:ring-4 focus:ring-[#006D77]/20 focus:border-[#006D77] transition-all outline-none text-[#006D77] appearance-none cursor-pointer"
          >
            <option>General Question</option>
            <option>Technical Support</option>
            <option>Billing Question</option>
            <option>Feature Request</option>
            <option>Bug Report</option>
            <option>Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="contact-message" className="text-sm font-bold text-[#006D77]">Message</label>
          <textarea
            id="contact-message"
            required
            rows={5}
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            className="w-full bg-[#EDF6F9] border-2 border-[#83C5BE]/30 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 focus:ring-4 focus:ring-[#006D77]/20 focus:border-[#006D77] transition-all outline-none text-[#006D77] placeholder:text-[#006D77]/40 resize-none"
            placeholder="Tell us how we can help..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#E29578] text-white font-bold py-4 sm:py-5 rounded-xl sm:rounded-2xl shadow-lg shadow-[#E29578]/30 hover:bg-[#E29578]/90 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>

        {submitError && (
          <p className="text-center text-sm text-red-500 font-medium">
            {submitError}. Please try again.
          </p>
        )}

        <p className="text-center text-sm text-[#006D77]/60">
          Prefer direct email?{' '}
          <a href="mailto:support@shanesfund.com" className="text-[#006D77] font-bold hover:underline">
            support@shanesfund.com
          </a>
        </p>
      </form>
    </div>
  );
};

const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#EDF6F9]">
      <Header onScrollToSignup={() => {}} />

      <main className="py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="flex items-center gap-2 text-[#006D77]/70 hover:text-[#006D77] font-medium mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </motion.button>

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4 sm:space-y-6 mb-12 sm:mb-16"
          >
            <span className="inline-block px-4 sm:px-5 py-2 bg-[#006D77]/10 text-[#006D77] rounded-full text-xs font-black uppercase tracking-widest">
              Support Center
            </span>
            <h1 className="shane-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[#006D77] tracking-tight leading-tight">
              How can we help you <br className="hidden sm:block"/>
              <span className="text-[#E29578] italic">win together?</span>
            </h1>
            <p className="text-base sm:text-lg text-[#006D77]/70 max-w-2xl mx-auto leading-relaxed">
              Whether you're troubleshooting or looking for tips on managing your pool, our team is here to help.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
              <a
                href="#faqs"
                className="bg-white text-[#006D77] border-2 border-[#83C5BE]/30 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold shadow-sm hover:shadow-md hover:border-[#006D77]/30 transition-all text-sm sm:text-base"
              >
                Browse FAQs
              </a>
              <a
                href="#contact"
                className="bg-[#E29578] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold shadow-lg shadow-[#E29578]/30 hover:bg-[#E29578]/90 transition-all text-sm sm:text-base"
              >
                Contact Us
              </a>
            </div>
          </motion.div>

          {/* Two-column layout */}
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* FAQ Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              id="faqs"
              className="scroll-mt-32"
            >
              <FaqSection />

              {/* Quote card */}
              <div className="mt-10 sm:mt-12 p-6 sm:p-8 bg-[#F2E9D4]/50 border-2 border-dashed border-[#E29578]/30 rounded-[1.5rem] sm:rounded-[2rem] text-center">
                <p className="text-sm sm:text-base italic text-[#006D77]/70">
                  "Here's to better odds, zero drama, and retirement funds that actually fund retirements."
                </p>
                <p className="text-xs text-[#006D77]/50 mt-2 font-medium">— The Shane's Fund Team</p>
              </div>
            </motion.div>

            {/* Form Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              id="contact"
              className="scroll-mt-32"
            >
              <SupportForm />

              {/* Info cards */}
              <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-[#83C5BE]/20 shadow-sm">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#006D77]/10 text-[#006D77] rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                    <Mail size={18} />
                  </div>
                  <h4 className="font-bold text-[#006D77] mb-1 text-sm sm:text-base">Email Support</h4>
                  <p className="text-xs text-[#006D77]/60">support@shanesfund.com</p>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-[#83C5BE]/20 shadow-sm">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#E29578]/10 text-[#E29578] rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                    <Clock size={18} />
                  </div>
                  <h4 className="font-bold text-[#006D77] mb-1 text-sm sm:text-base">Response Time</h4>
                  <p className="text-xs text-[#006D77]/60">Usually under 24 hours</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
