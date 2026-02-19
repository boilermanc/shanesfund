import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Clock, ChevronDown, CheckCircle, MessageSquare, HelpCircle, Send } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { supabase } from '../../lib/supabase';

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
        <h2 className="text-2xl sm:text-3xl font-black text-[#006D77] mb-2 tracking-tight">
          Frequently Asked <span className="italic font-serif">Questions</span>
        </h2>
        <p className="text-[#006D77]/60 font-medium text-sm sm:text-base">Quick answers to common questions.</p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => (
          <div
            key={idx}
            className={`group bg-white rounded-[1.5rem] sm:rounded-[2rem] border-2 transition-all duration-300 ${
              openIndex === idx
                ? 'border-[#006D77]/30 shadow-xl shadow-[#006D77]/10'
                : 'border-[#83C5BE]/20 hover:border-[#006D77]/20 shadow-sm'
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
                <p className={`text-sm sm:text-base font-black transition-colors ${
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
                    : 'bg-[#EDF6F9] text-[#006D77]/60 group-hover:bg-[#006D77]/10'
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
  const [rateLimited, setRateLimited] = useState(false);
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

    try {
      const { data, error } = await (supabase
        .from('contact_submissions') as any)
        .insert({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        })
        .select('id, created_at')
        .single() as { data: { id: string; created_at: string } | null; error: { message: string } | null };

      if (error || !data) {
        setSubmitError(error?.message ?? 'Failed to submit');
        setIsSubmitting(false);
        return;
      }

      // Fire-and-forget: send payload to n8n webhook
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.id,
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
            created_at: data.created_at,
          }),
        }).catch(console.error);
      }

      setIsSubmitting(false);
      setSubmitted(true);

      // Rate limit: disable submit for 30 seconds
      setRateLimited(true);
      setTimeout(() => setRateLimited(false), 30_000);
    } catch {
      setSubmitError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#006D77] text-white p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] text-center space-y-4 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-[0.05] text-[8rem] font-black pointer-events-none select-none rotate-12">
          SENT
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-14 h-14 sm:w-16 sm:h-16 bg-[#83C5BE] text-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg"
        >
          <CheckCircle size={28} />
        </motion.div>
        <h3 className="text-xl sm:text-2xl font-black">Message Received!</h3>
        <p className="text-sm sm:text-base text-white/70 max-w-md mx-auto">
          Thanks for reaching out, <span className="font-bold text-white">{formData.name}</span>.
          We'll get back to you at <span className="font-bold text-white">{formData.email}</span> within 24 hours.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setFormData({ name: '', email: '', subject: 'General Question', message: '' });
          }}
          className="text-[#83C5BE] font-bold hover:underline"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-xl border-2 border-[#83C5BE]/15 relative overflow-hidden">
      <div className="absolute top-8 right-8 opacity-[0.03] text-[8rem] sm:text-[10rem] font-black pointer-events-none select-none">
        HELP
      </div>
      <div className="mb-8 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-black text-[#006D77] mb-2 tracking-tight">
          Send us a <span className="italic font-serif">Message</span>
        </h2>
        <p className="text-[#006D77]/60 font-medium text-sm sm:text-base">Have a specific question? Fill out the form below.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
          <div className="space-y-2">
            <label htmlFor="contact-name" className="text-sm font-black text-[#006D77]">Full Name</label>
            <input
              id="contact-name"
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-[#EDF6F9] border-2 border-[#83C5BE]/20 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 focus:ring-4 focus:ring-[#006D77]/15 focus:border-[#006D77] transition-all outline-none text-[#006D77] placeholder:text-[#006D77]/30 font-medium"
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="contact-email" className="text-sm font-black text-[#006D77]">Email Address</label>
            <input
              id="contact-email"
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-[#EDF6F9] border-2 border-[#83C5BE]/20 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 focus:ring-4 focus:ring-[#006D77]/15 focus:border-[#006D77] transition-all outline-none text-[#006D77] placeholder:text-[#006D77]/30 font-medium"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="contact-subject" className="text-sm font-black text-[#006D77]">Subject</label>
          <select
            id="contact-subject"
            value={formData.subject}
            onChange={(e) => setFormData({...formData, subject: e.target.value})}
            className="w-full bg-[#EDF6F9] border-2 border-[#83C5BE]/20 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 focus:ring-4 focus:ring-[#006D77]/15 focus:border-[#006D77] transition-all outline-none text-[#006D77] appearance-none cursor-pointer font-medium"
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
          <label htmlFor="contact-message" className="text-sm font-black text-[#006D77]">Message</label>
          <textarea
            id="contact-message"
            required
            rows={5}
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            className="w-full bg-[#EDF6F9] border-2 border-[#83C5BE]/20 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 focus:ring-4 focus:ring-[#006D77]/15 focus:border-[#006D77] transition-all outline-none text-[#006D77] placeholder:text-[#006D77]/30 resize-none font-medium"
            placeholder="Tell us how we can help..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || rateLimited}
          className="w-full bg-[#E29578] text-white font-black py-4 sm:py-5 rounded-xl sm:rounded-2xl shadow-lg shadow-[#E29578]/30 hover:bg-[#E29578]/90 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'Sending...' : rateLimited ? 'Please wait...' : (
            <>
              <Send size={18} />
              Send Message
            </>
          )}
        </button>

        {submitError && (
          <p className="text-center text-sm text-red-500 font-medium">
            {submitError}. Please try again.
          </p>
        )}

        <p className="text-center text-sm text-[#006D77]/50">
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
    <div className="min-h-screen bg-[#EDF6F9] relative">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#E29578]/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[50%] h-[50%] bg-[#006D77]/5 blur-[120px] rounded-full" />
      </div>

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
            className="text-center space-y-4 sm:space-y-6 mb-12 sm:mb-16 relative"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-48 sm:h-64 bg-[#83C5BE]/10 blur-[80px] rounded-full pointer-events-none -z-10" />
            <span className="inline-block px-4 sm:px-5 py-2 bg-[#006D77]/10 text-[#006D77] rounded-full text-xs font-black uppercase tracking-widest">
              Support Center
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[#006D77] tracking-tighter leading-tight">
              How can we help you <br className="hidden sm:block"/>
              <span className="text-[#E29578] italic font-serif">win together?</span>
            </h1>
            <p className="text-base sm:text-lg text-[#006D77]/60 max-w-2xl mx-auto leading-relaxed font-medium">
              Whether you're troubleshooting or looking for tips on managing your pool, our team is here to help.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
              <a
                href="#faqs"
                className="bg-white text-[#006D77] border-2 border-[#83C5BE]/20 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-sm hover:shadow-lg hover:border-[#006D77]/30 hover:-translate-y-0.5 transition-all text-sm sm:text-base flex items-center gap-2"
              >
                <HelpCircle size={18} />
                Browse FAQs
              </a>
              <a
                href="#contact"
                className="bg-[#E29578] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-lg shadow-[#E29578]/30 hover:bg-[#E29578]/90 hover:-translate-y-0.5 transition-all text-sm sm:text-base flex items-center gap-2"
              >
                <MessageSquare size={18} />
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
              <div className="mt-10 sm:mt-12 p-6 sm:p-8 bg-[#F2E9D4]/40 border-2 border-dashed border-[#E29578]/30 rounded-[1.5rem] sm:rounded-[2.5rem] text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#EDF6F9] px-3">
                  <span className="text-lg">🍀</span>
                </div>
                <p className="text-sm sm:text-base italic text-[#006D77]/70 font-serif leading-relaxed">
                  "Here's to better odds, zero drama, and retirement funds that actually fund retirements."
                </p>
                <p className="text-xs text-[#006D77]/40 mt-3 font-black uppercase tracking-widest">
                  — The Shane's Fund Team
                </p>
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
                <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-[#83C5BE]/15 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#006D77]/10 text-[#006D77] rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <Mail size={18} />
                  </div>
                  <h4 className="font-black text-[#006D77] mb-1 text-sm sm:text-base">Email Support</h4>
                  <p className="text-xs text-[#006D77]/50 font-medium">support@shanesfund.com</p>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-[#83C5BE]/15 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#E29578]/10 text-[#E29578] rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <Clock size={18} />
                  </div>
                  <h4 className="font-black text-[#006D77] mb-1 text-sm sm:text-base">Response Time</h4>
                  <p className="text-xs text-[#006D77]/50 font-medium">Usually under 24 hours</p>
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
