import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sprout, BookOpen, Palette, Clover, Users, Shield, TrendingUp } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface AboutUsProps {
  onBack: () => void;
}

const AboutUs: React.FC<AboutUsProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#EDF6F9] relative">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#E29578]/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[50%] h-[50%] bg-[#006D77]/5 blur-[120px] rounded-full" />
      </div>

      <Header onScrollToSignup={() => {}} />

      <main className="py-12 sm:py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <div className="space-y-16 sm:space-y-24">
            {/* Artistic Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center relative py-8 sm:py-12"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-48 sm:h-64 bg-[#E29578]/15 blur-[80px] rounded-full pointer-events-none -z-10" />
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-6xl sm:text-8xl mb-4"
              >
                <Clover className="inline-block text-[#83C5BE]" size={64} />
              </motion.div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-[#006D77] tracking-tighter leading-none">
                The <span className="text-[#E29578]">Origin</span> <br />
                <span className="italic font-serif">Story</span>
              </h1>
              <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6">
                <div className="h-px w-8 sm:w-12 bg-[#83C5BE]" />
                <p className="text-[#006D77]/60 font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[10px] sm:text-xs">
                  A Sweetwater Technologies Project
                </p>
                <div className="h-px w-8 sm:w-12 bg-[#83C5BE]" />
              </div>
            </motion.div>

            {/* Section 1: The Spark */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-5 sm:space-y-6"
              >
                <div className="inline-block px-3 sm:px-4 py-1 bg-[#E29578]/10 text-[#E29578] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#E29578]/20">
                  How It Started
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#006D77] leading-tight">
                  It started with a text message in the produce aisle.
                </h2>
                <p className="text-base sm:text-lg text-[#006D77]/70 leading-relaxed font-medium italic font-serif">
                  "Shane—brother-in-law, dreamer, eternal optimist—had been running lottery pools with friends and coworkers for years. Spreadsheets everywhere."
                </p>
                <p className="text-sm sm:text-base text-[#006D77]/70 leading-relaxed font-medium">
                  Shane had already cornered his sister Sheree and regaled her with his vision for the perfect lottery pool app. For forty-five minutes. In detail. With enthusiasm. Because that's Shane.
                </p>
                <p className="text-sm sm:text-base text-[#006D77]/70 leading-relaxed font-medium">
                  Sheree listened. Sheree always listens. (She's a saint.)
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative group"
              >
                <div className="absolute -inset-3 sm:-inset-4 bg-[#006D77]/5 rounded-[3rem] sm:rounded-[4rem] blur-2xl group-hover:blur-3xl transition-all" />
                <div className="relative bg-white p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-xl border-2 sm:border-4 border-[#83C5BE]/20 -rotate-1 group-hover:rotate-0 transition-transform duration-500">
                  <div className="space-y-4 text-[#006D77]/70 font-medium leading-relaxed text-sm sm:text-base">
                    <p>
                      But Shane wasn't done. He went straight to the source—texting his brother-in-law directly with the pitch. That brother-in-law was standing in the grocery store, phone in one hand, shopping list in the other.
                    </p>
                    <p>
                      Later, Sheree filled him in: <em className="text-[#006D77] font-bold">"Yeah, he talked to me about this for like 45 minutes before he texted you."</em>
                    </p>
                    <p>
                      He read Shane's message twice. Looked at the avocados. Looked back at his phone.
                    </p>
                    <p className="text-[#006D77] font-bold text-base sm:text-lg italic">
                      "This actually has legs."
                    </p>
                    <p>
                      So we built it. In secret. And then we surprised Shane with it.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-dashed border-[#83C5BE]/30 text-center">
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#83C5BE]">
                      The Produce Aisle Epiphany — Est. 2024
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Section 2: Why We Built This — Dark Block */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-[#006D77] rounded-[2.5rem] sm:rounded-[3.5rem] md:rounded-[4rem] p-8 sm:p-12 md:p-20 text-white relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-[0.04] text-[8rem] sm:text-[12rem] rotate-12 pointer-events-none font-serif italic select-none">
                LUCK
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-3 sm:mb-4">
                Why We Built <br className="hidden sm:block" />
                <span className="text-[#83C5BE]">This</span>
              </h2>
              <p className="text-white/60 font-medium text-sm sm:text-base mb-8 sm:mb-12 max-w-lg">
                Because lottery pools should be fun, not frustrating.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
                {[
                  {
                    icon: <Users size={32} />,
                    title: 'Transparency',
                    desc: 'Because you shouldn\'t need a law degree to figure out who owes what.'
                  },
                  {
                    icon: <TrendingUp size={32} />,
                    title: 'Fair Splits',
                    desc: 'When you win, everyone should know exactly what\'s theirs. No confusion, no drama.'
                  },
                  {
                    icon: <Shield size={32} />,
                    title: 'Trust',
                    desc: 'And honestly? Because Shane deserved to see his idea come to life.'
                  }
                ].map((item, i) => (
                  <div key={i} className="space-y-3 sm:space-y-4 group">
                    <div className="text-[#83C5BE] group-hover:scale-110 transition-transform origin-left">
                      {item.icon}
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-[#E29578] uppercase tracking-widest">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Section 3: Who We Are */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8 sm:space-y-10"
            >
              <div className="text-center">
                <span className="inline-block px-3 sm:px-4 py-1 bg-[#006D77]/10 text-[#006D77] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#006D77]/10 mb-4">
                  The Team
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#006D77] tracking-tighter">
                  Meet <span className="italic font-serif">Sweetwater Technology</span>
                </h2>
                <p className="text-sm sm:text-base text-[#006D77]/60 mt-3 max-w-2xl mx-auto font-medium">
                  An Atlanta-based team that builds things we believe in. By day, we're farmers. Literally.
                </p>
              </div>

              <div className="bg-white p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-xl border-2 border-[#83C5BE]/10">
                <p className="text-sm sm:text-base text-[#006D77]/70 font-medium leading-relaxed mb-6">
                  Our flagship platform <strong className="text-[#006D77]">Sproutify</strong> powers aeroponic vertical farms, grows microgreens, ships seedlings across the country, and brings agricultural education into K-12 classrooms. We've got sensors in greenhouses, AI analyzing plant health, and a deep appreciation for things that grow.
                </p>
                <p className="text-sm sm:text-base text-[#006D77]/70 font-medium leading-relaxed mb-8">
                  But we also build apps that help people connect, grow spiritually, and yes—dream a little bigger together.
                </p>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {[
                    {
                      icon: <Sprout className="text-[#83C5BE]" size={24} />,
                      name: 'Sproutify',
                      desc: 'Vertical farming technology, from commercial operations to school programs',
                      accent: '#83C5BE'
                    },
                    {
                      icon: <BookOpen className="text-[#006D77]" size={24} />,
                      name: 'Rejoice',
                      desc: 'A Bible study app that meets you where you are emotionally',
                      accent: '#006D77'
                    },
                    {
                      icon: <Palette className="text-[#E29578]" size={24} />,
                      name: 'Once Upon a Drawing',
                      desc: 'Creative art and illustration',
                      accent: '#E29578'
                    },
                    {
                      icon: <Clover className="text-[#006D77]" size={24} />,
                      name: "Shane's Retirement Fund",
                      desc: 'The app you\'re using right now',
                      accent: '#006D77'
                    }
                  ].map((project, i) => (
                    <div
                      key={i}
                      className="group p-5 sm:p-6 bg-[#EDF6F9]/50 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-[#83C5BE]/10 hover:border-[#006D77]/20 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${project.accent}10` }}
                      >
                        {project.icon}
                      </div>
                      <h4 className="font-black text-[#006D77] text-sm sm:text-base mb-1">{project.name}</h4>
                      <p className="text-xs sm:text-sm text-[#006D77]/60 font-medium">{project.desc}</p>
                    </div>
                  ))}
                </div>

                <p className="text-sm sm:text-base text-[#006D77]/70 font-medium leading-relaxed mt-8">
                  We're not a faceless tech company. We're farmers, builders, believers, and yes—lottery pool enthusiasts who got tired of messy spreadsheets.
                </p>
              </div>
            </motion.div>

            {/* Our Promise — Highlight Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8"
            >
              <div className="p-8 sm:p-12 bg-[#E29578] text-white rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-10 text-5xl sm:text-6xl group-hover:rotate-12 transition-transform">
                  <Shield size={64} />
                </div>
                <h3 className="font-black uppercase text-[10px] tracking-[0.3em] sm:tracking-[0.4em] mb-4 sm:mb-6 opacity-70">
                  Our Promise
                </h3>
                <p className="text-xl sm:text-2xl font-black leading-tight">
                  We're not here to take a cut of your winnings. We're not a gambling company. We're just building the best dang pool management tool we can.
                </p>
              </div>
              <div className="p-8 sm:p-12 bg-white border-2 sm:border-4 border-[#83C5BE]/30 rounded-[2.5rem] sm:rounded-[3.5rem] flex flex-col justify-center shadow-xl">
                <h3 className="font-black text-[#006D77]/50 uppercase text-[10px] tracking-[0.3em] sm:tracking-[0.4em] mb-4 sm:mb-6">
                  What That Means
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {[
                    { icon: <Shield size={18} />, text: 'You handle the tickets & money' },
                    { icon: <Users size={18} />, text: 'We handle organization & tracking' },
                    { icon: <TrendingUp size={18} />, text: '100% of winnings go to your pool' },
                    { icon: <Clover size={18} />, text: 'Transparent, easy, maybe a little fun' }
                  ].map((p, i) => (
                    <div key={i} className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-black text-[#006D77] group">
                      <span className="w-9 h-9 sm:w-10 sm:h-10 bg-[#EDF6F9] rounded-xl flex items-center justify-center border-2 border-[#83C5BE]/20 text-[#006D77] group-hover:border-[#006D77]/40 transition-colors flex-shrink-0">
                        {p.icon}
                      </span>
                      {p.text}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Inspirational Note — Dashed Border */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center py-10 sm:py-12 px-6 sm:px-8 border-2 sm:border-4 border-dashed border-[#83C5BE]/30 rounded-[2.5rem] sm:rounded-[4rem] relative"
            >
              <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 bg-[#EDF6F9] px-4 sm:px-6">
                <Clover className="text-[#83C5BE]" size={24} />
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#006D77] leading-tight mb-4">
                Whether your pool is 3 coworkers or 50 family members, <br className="hidden md:block" />
                <span className="text-[#E29578]">we're rooting for you.</span>
              </p>
              <p className="text-sm sm:text-base text-[#006D77]/60 font-medium max-w-xl mx-auto mb-6">
                May your numbers hit. May your shares be calculated correctly. And may you never, ever have to update another spreadsheet.
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-[#006D77]">
                Good luck out there. <span className="inline-block">🍀</span>
              </p>
            </motion.div>

            {/* Archival Seal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col items-center pt-8 sm:pt-12"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 sm:border-8 border-[#83C5BE]/15 flex items-center justify-center opacity-30 select-none">
                <Clover size={36} className="text-[#006D77]" />
              </div>
              <p className="text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.4em] sm:tracking-[0.5em] mt-4">
                Shane's Fund Archives — Sweetwater Tech
              </p>
              <p className="text-[#006D77]/40 font-medium italic text-xs sm:text-sm mt-3">
                We grow greens. We build apps. We believe in big dreams.
              </p>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;
