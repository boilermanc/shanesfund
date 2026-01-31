import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Sprout, BookOpen, Palette, Clover } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface AboutUsProps {
  onBack: () => void;
}

const AboutUs: React.FC<AboutUsProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#EDF6F9]">
      <Header onScrollToSignup={() => {}} />

      <main className="py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 sm:mb-14"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#006D77]/10 text-[#006D77] mb-4">
              <Heart size={28} />
            </div>
            <h1 className="shane-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#006D77] mb-3 sm:mb-4">
              About Us
            </h1>
            <p className="text-base sm:text-lg text-[#006D77]/70 font-medium">
              The story behind Shane's Retirement Fund
            </p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 md:p-12 shadow-sm"
          >
            <div className="prose prose-lg max-w-none">
              {/* Origin Story */}
              <Section title="The Origin Story">
                <p>It started with a text message in the produce aisle.</p>

                <p>
                  Shane—brother-in-law, dreamer, eternal optimist—had been running lottery pools with friends and coworkers for years. Spreadsheets everywhere. Group chats full of "did you buy the tickets?" and "who owes what?" and the occasional "wait, we won $12?"
                </p>

                <p>Now, here's the thing about Shane: <em>Shane is a talker.</em></p>

                <p>
                  Before that text ever landed, Shane had already cornered his sister Sheree and regaled her with his vision for the perfect lottery pool app. For forty-five minutes. In detail. With enthusiasm. Because that's Shane.
                </p>

                <p>Sheree listened. Sheree always listens. (She's a saint.)</p>

                <p>
                  But Shane wasn't done. He went straight to the source—texting his brother-in-law directly with the pitch.
                </p>

                <p>
                  That brother-in-law? He was standing in the grocery store, phone in one hand, shopping list in the other, when the text came through. Later, Sheree filled him in: <em>"Yeah, he talked to me about this for like 45 minutes before he texted you."</em>
                </p>

                <p>He read Shane's message twice. Looked at the avocados. Looked back at his phone.</p>

                <p><em>"This actually has legs,"</em> he thought.</p>

                <p>So we built it. In secret. And then we surprised Shane with it.</p>

                <p>
                  <strong>Shane's Retirement Fund</strong> was born—not in a boardroom, not from a VC pitch deck, but from a family text thread and a whole lot of "wouldn't it be cool if..."
                </p>
              </Section>

              {/* Who We Are */}
              <Section title="Who We Are">
                <p>We're <strong>Sweetwater Technology</strong>, an Atlanta-based team that builds things we believe in.</p>

                <p>
                  By day, we're farmers. Literally. Our flagship platform <strong>Sproutify</strong> powers aeroponic vertical farms, grows microgreens, ships seedlings across the country, and brings agricultural education into K-12 classrooms. We've got sensors in greenhouses, AI analyzing plant health, and a deep appreciation for things that grow.
                </p>

                <p>But we also build apps that help people connect, grow spiritually, and yes—dream a little bigger together.</p>

                <div className="bg-[#EDF6F9] rounded-xl p-4 sm:p-6 mt-6 mb-6">
                  <p className="font-bold text-[#006D77] mb-4">Our family of projects includes:</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Sprout className="text-[#83C5BE] mt-1 flex-shrink-0" size={20} />
                      <div>
                        <span className="font-bold text-[#006D77]">Sproutify</span>
                        <span className="text-[#006D77]/80"> — Vertical farming technology, from commercial operations to school programs</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <BookOpen className="text-[#83C5BE] mt-1 flex-shrink-0" size={20} />
                      <div>
                        <span className="font-bold text-[#006D77]">Rejoice</span>
                        <span className="text-[#006D77]/80"> — A Bible study app that meets you where you are emotionally</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Palette className="text-[#83C5BE] mt-1 flex-shrink-0" size={20} />
                      <div>
                        <span className="font-bold text-[#006D77]">Once Upon a Drawing</span>
                        <span className="text-[#006D77]/80"> — Creative art and illustration</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clover className="text-[#83C5BE] mt-1 flex-shrink-0" size={20} />
                      <div>
                        <span className="font-bold text-[#006D77]">Shane's Retirement Fund</span>
                        <span className="text-[#006D77]/80"> — The app you're using right now</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p>
                  We're not a faceless tech company. We're farmers, builders, believers, and yes—lottery pool enthusiasts who got tired of messy spreadsheets.
                </p>
              </Section>

              {/* Why We Built This */}
              <Section title="Why We Built This">
                <p>Because lottery pools should be fun, not frustrating.</p>

                <p>Because you shouldn't need a law degree to figure out who owes what.</p>

                <p>Because when you win (and we really, really hope you do), everyone should know exactly what's theirs.</p>

                <p>And honestly? Because Shane deserved to see his idea come to life.</p>
              </Section>

              {/* Our Promise */}
              <Section title="Our Promise">
                <div className="bg-[#83C5BE]/20 border border-[#83C5BE]/30 rounded-xl p-4 sm:p-6 mb-6">
                  <p className="text-[#006D77] font-bold">
                    We're not here to take a cut of your winnings. We're not a gambling company.
                  </p>
                </div>

                <p>
                  We're just building the best dang pool management tool we can—transparent, easy to use, and maybe a little fun.
                </p>

                <p>
                  You handle the tickets. You handle the money between friends. We handle the organization, the tracking, and the "wait, which numbers did we play?" moments.
                </p>
              </Section>

              {/* Note to Dreamers */}
              <Section title="A Note to Every Pool Captain, Member, and Dreamer">
                <p>
                  Whether your pool is 3 coworkers splitting a Powerball ticket or 50 family members going in on Mega Millions, we're rooting for you.
                </p>

                <p>
                  May your numbers hit. May your shares be calculated correctly. And may you never, ever have to update another spreadsheet.
                </p>

                <p>
                  Here's to better odds, zero drama, and retirement funds that actually fund retirements.
                </p>

                <div className="text-center mt-8">
                  <p className="text-2xl sm:text-3xl font-bold text-[#006D77]">
                    Good luck out there. <span className="inline-block">🍀</span>
                  </p>
                </div>
              </Section>

              {/* Footer */}
              <div className="mt-12 pt-8 border-t border-[#006D77]/10 text-center">
                <p className="text-[#006D77]/60 font-medium italic">
                  Shane's Retirement Fund is a product of Sweetwater Technology, LLC — Atlanta, Georgia
                </p>
                <p className="text-[#006D77]/60 font-medium italic mt-2">
                  We grow greens. We build apps. We believe in big dreams.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Section component for consistent styling
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mt-10 first:mt-0">
    <h2 className="text-xl sm:text-2xl font-bold text-[#006D77] mb-4 pb-2 border-b border-[#006D77]/10">
      {title}
    </h2>
    <div className="text-[#006D77]/80 font-medium leading-relaxed space-y-4 [&_p]:leading-relaxed">
      {children}
    </div>
  </div>
);

export default AboutUs;
