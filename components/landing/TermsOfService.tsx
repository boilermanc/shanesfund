import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Scale, ShieldCheck, UserCheck, CreditCard, Gavel } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface TermsOfServiceProps {
  onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
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

          <div className="space-y-12 sm:space-y-16">
            {/* Legal Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4 relative"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-48 sm:h-64 bg-[#E29578]/15 blur-[80px] rounded-full pointer-events-none -z-10" />
              <div className="relative inline-block">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <FileText className="text-[#006D77] mx-auto" size={56} />
                </motion.div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-[#E29578] rounded-full border-3 border-[#EDF6F9] flex items-center justify-center text-white text-[8px] sm:text-[9px] font-black">
                  TM
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-[#006D77] tracking-tighter">
                The Pool Captain's <span className="italic font-serif text-[#E29578]">Accord</span>
              </h1>
              <p className="text-[#006D77]/50 font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[10px] sm:text-xs">
                Official Terms of Service — Effective January 31, 2026
              </p>
            </motion.div>

            {/* The "Human" Summary + Core Pillars */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8"
            >
              <div className="p-8 sm:p-12 bg-[#006D77] text-white rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-10 text-5xl sm:text-6xl group-hover:rotate-12 transition-transform">
                  <Scale size={64} />
                </div>
                <h3 className="font-black uppercase text-[10px] tracking-[0.3em] sm:tracking-[0.4em] mb-4 sm:mb-6 text-[#83C5BE]">
                  The Plain Language Summary
                </h3>
                <p className="text-lg sm:text-2xl font-black leading-tight">
                  We're a pool management tool — not a gambling company. We never touch your money. You keep your winnings. We just help you stay organized and play fair.
                </p>
              </div>
              <div className="p-8 sm:p-12 bg-white border-2 sm:border-4 border-[#83C5BE]/30 rounded-[2.5rem] sm:rounded-[3.5rem] flex flex-col justify-center shadow-xl">
                <h3 className="font-black text-[#006D77]/50 uppercase text-[10px] tracking-[0.3em] sm:tracking-[0.4em] mb-4 sm:mb-6">
                  Core Legal Pillars
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {[
                    { icon: <ShieldCheck size={18} />, text: 'We Never Handle Your Money' },
                    { icon: <UserCheck size={18} />, text: 'You Own Your Ticket Data' },
                    { icon: <Scale size={18} />, text: 'Fair & Transparent Pool Rules' },
                    { icon: <CreditCard size={18} />, text: 'Cancel Anytime, No Tricks' }
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

            {/* The Detailed Document */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-6 sm:p-12 md:p-20 rounded-[2.5rem] sm:rounded-[3.5rem] md:rounded-[4rem] border-2 sm:border-4 border-[#83C5BE]/20 shadow-inner relative overflow-hidden"
            >
              <div className="absolute top-8 sm:top-12 right-8 sm:right-12 opacity-[0.02] text-[8rem] sm:text-[12rem] font-black pointer-events-none select-none tracking-tighter">
                TERMS
              </div>

              <div className="space-y-10 sm:space-y-12">
                {/* Intro */}
                <div className="text-[#006D77]/70 font-medium leading-relaxed text-sm sm:text-base">
                  <p className="mb-4">
                    Welcome to Shane's Retirement Fund ("Service," "App," "Platform," "we," "us," or "our"). These Terms of Service ("Terms," "Agreement") constitute a legally binding agreement between you ("User," "you," or "your") and Shane's Retirement Fund governing your access to and use of our mobile application and related services.
                  </p>
                  <div className="bg-[#FFDDD2]/30 border-2 border-[#E29578]/20 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6">
                    <p className="text-[#006D77] font-bold text-sm sm:text-base">
                      BY ACCESSING OR USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT ACCESS OR USE THE SERVICE.
                    </p>
                  </div>
                </div>

                {/* Section 1 */}
                <Section number="01" title="Service Description & Important Disclaimers">
                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">1.1 Nature of Service</h4>
                  <p>
                    Shane's Retirement Fund is a <strong>management and organizational tool only</strong>. The Service assists users in organizing lottery pools, tracking lottery ticket information, managing pool membership, and calculating potential winnings shares.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">1.2 Critical Disclaimers</h4>
                  <p className="font-bold text-[#006D77] mb-3 sm:mb-4 text-sm sm:text-base">YOU EXPRESSLY UNDERSTAND AND AGREE THAT:</p>
                  <ul className="space-y-2 sm:space-y-3">
                    <li><strong>(a) We do not purchase lottery tickets.</strong> Users are solely responsible for purchasing all lottery tickets through authorized lottery retailers.</li>
                    <li><strong>(b) We do not handle, collect, transfer, or distribute money</strong> related to lottery pool contributions, ticket purchases, or winnings between users.</li>
                    <li><strong>(c) We are not a gambling operator,</strong> lottery retailer, lottery courier, or money transmitter.</li>
                    <li><strong>(d) We are not responsible for the distribution of lottery winnings.</strong> Users must independently arrange and execute any distribution of prize money.</li>
                    <li><strong>(e) We do not guarantee the accuracy of lottery results.</strong> Users must independently verify all lottery results through official lottery sources.</li>
                    <li><strong>(f) Users are solely responsible for compliance with all applicable laws</strong> regarding lottery participation in their jurisdiction.</li>
                  </ul>
                </Section>

                {/* Section 2 */}
                <Section number="02" title="Eligibility & Account Registration">
                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">2.1 Age Requirement</h4>
                  <p>
                    You must be at least eighteen (18) years of age, or the minimum age required to participate in lottery games in your jurisdiction (whichever is higher), to use this Service.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">2.2 Geographic Restrictions</h4>
                  <p>
                    The Service is intended for use only in jurisdictions where lottery participation is legal. You represent and warrant that you are located in a jurisdiction where lottery games are legally permitted.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">2.3 Account Registration</h4>
                  <p>
                    To access certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. You are responsible for safeguarding your account credentials and for all activities that occur under your account.
                  </p>
                </Section>

                {/* Section 3 */}
                <Section number="03" title="Subscription & Payment Terms">
                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">3.1 Subscription Tiers</h4>
                  <p>
                    The Service offers both free and paid subscription tiers. Paid subscriptions ("Premium" and "Pro") provide access to enhanced features as described on our pricing page.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">3.2 Billing and Payment</h4>
                  <p>
                    Paid subscriptions are billed in advance on a monthly or annual basis. Payment processing is handled by our third-party payment processor, Stripe, Inc.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">3.3 Automatic Renewal</h4>
                  <p>
                    <strong>SUBSCRIPTIONS AUTOMATICALLY RENEW</strong> at the end of each billing period unless cancelled prior to the renewal date. You may cancel your subscription at any time through your account settings or by contacting customer support.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">3.4 Refund Policy</h4>
                  <p>
                    Subscription fees are generally non-refundable except as required by applicable law. If you cancel your subscription, you will continue to have access to paid features until the end of your current billing period.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">3.5 Price Changes</h4>
                  <p>
                    We reserve the right to modify subscription prices at any time. Price changes will not affect your current subscription period but will apply upon renewal. We will provide reasonable notice of any price increases.
                  </p>
                </Section>

                {/* Section 4 */}
                <Section number="04" title="User Conduct & Responsibilities">
                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">4.1 Pool Captain Responsibilities</h4>
                  <p>
                    Users who create lottery pools ("Pool Captains") assume responsibility for the accurate entry of ticket information, proper management of pool membership, and fair treatment of pool members. Pool Captains acknowledge that they are solely responsible for any disputes arising within their pools.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">4.2 Prohibited Conduct</h4>
                  <p>You agree not to:</p>
                  <ul className="space-y-2 mt-3">
                    <li>(a) Use the Service for any unlawful purpose or in violation of any applicable laws or regulations;</li>
                    <li>(b) Provide false, misleading, or fraudulent information;</li>
                    <li>(c) Attempt to gain unauthorized access to any portion of the Service;</li>
                    <li>(d) Interfere with or disrupt the integrity or performance of the Service;</li>
                    <li>(e) Create multiple accounts for fraudulent purposes;</li>
                    <li>(f) Use the Service to harass, abuse, or harm other users.</li>
                  </ul>
                </Section>

                {/* Section 5 */}
                <Section number="05" title="Intellectual Property">
                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">5.1 Ownership</h4>
                  <p>
                    The Service and its original content, features, and functionality are and will remain the exclusive property of Shane's Retirement Fund and its licensors. The Service is protected by copyright, trademark, and other laws.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">5.2 License to Use</h4>
                  <p>
                    Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your personal, non-commercial purposes.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">5.3 User Content</h4>
                  <p>
                    You retain ownership of any content you submit to the Service (such as ticket images and pool information). By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, store, and display such content solely for the purpose of providing and improving the Service.
                  </p>
                </Section>

                {/* Section 6 */}
                <Section number="06" title="Disclaimer of Warranties">
                  <div className="bg-[#EDF6F9] rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 mt-4">
                    <p className="text-[#006D77] font-bold text-sm sm:text-base">
                      THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
                    </p>
                  </div>
                  <p className="mt-4">
                    We do not warrant that: (a) the Service will function uninterrupted, secure, or available at any particular time or location; (b) any errors or defects will be corrected; (c) the Service is free of viruses or other harmful components; (d) the results of using the Service will meet your requirements; or (e) lottery results or winning calculations displayed within the Service are accurate or complete.
                  </p>
                </Section>

                {/* Section 7 */}
                <Section number="07" title="Limitation of Liability">
                  <div className="bg-[#EDF6F9] rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 mt-4">
                    <p className="text-[#006D77] font-bold mb-3 sm:mb-4 text-sm sm:text-base">
                      TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL SHANE'S RETIREMENT FUND BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION:
                    </p>
                    <ul className="space-y-2 text-[#006D77]/70 text-sm">
                      <li>(a) Loss of profits, data, use, goodwill, or other intangible losses;</li>
                      <li>(b) Any failure to distribute or properly allocate lottery winnings among pool members;</li>
                      <li>(c) Any disputes between pool members regarding contributions or winnings;</li>
                      <li>(d) Inaccurate lottery results or winning calculations;</li>
                      <li>(e) Failure to properly record, scan, or store ticket information;</li>
                      <li>(f) Any other matter relating to the Service.</li>
                    </ul>
                  </div>
                  <p className="mt-4 font-bold text-[#006D77] text-sm sm:text-base">
                    OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING TO THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US, IF ANY, DURING THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE DATE OF THE CLAIM.
                  </p>
                </Section>

                {/* Section 8 */}
                <Section number="08" title="Indemnification">
                  <p>
                    You agree to defend, indemnify, and hold harmless Shane's Retirement Fund and its officers, directors, employees, agents, licensors, and suppliers from and against any claims, actions, or demands, including without limitation reasonable legal and accounting fees, arising from or related to: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party rights; (d) any dispute between you and other pool members; or (e) your violation of any applicable laws or regulations.
                  </p>
                </Section>

                {/* Section 9 */}
                <Section number="09" title="Dispute Resolution">
                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">9.1 Informal Resolution</h4>
                  <p>
                    Before filing a claim against us, you agree to attempt to resolve the dispute informally by contacting us at legal@shanesretirementfund.com. We will attempt to resolve the dispute informally within sixty (60) days.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">9.2 Binding Arbitration</h4>
                  <p>
                    If informal resolution is unsuccessful, any dispute, controversy, or claim arising out of or relating to these Terms shall be resolved by binding arbitration administered by the American Arbitration Association ("AAA") in accordance with its Commercial Arbitration Rules. The arbitration shall be conducted in Delaware, unless otherwise agreed by the parties.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">9.3 Class Action Waiver</h4>
                  <div className="bg-[#FFDDD2]/30 border-2 border-[#E29578]/20 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 mt-4">
                    <p className="text-[#006D77] font-bold text-sm sm:text-base">
                      YOU AND SHANE'S RETIREMENT FUND AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
                    </p>
                  </div>
                </Section>

                {/* Section 10 */}
                <Section number="10" title="Termination">
                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">10.1 Termination by You</h4>
                  <p>
                    You may terminate your account at any time by deleting your account through the app settings or by contacting customer support. Upon termination, your right to use the Service will immediately cease.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">10.2 Termination by Us</h4>
                  <p>
                    We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">10.3 Effect of Termination</h4>
                  <p>
                    Upon termination, all provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnification, and limitations of liability.
                  </p>
                </Section>

                {/* Section 11 */}
                <Section number="11" title="Governing Law">
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                  </p>
                </Section>

                {/* Section 12 */}
                <Section number="12" title="Changes to Terms">
                  <p>
                    We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will provide at least thirty (30) days' notice prior to any new terms taking effect. By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms.
                  </p>
                </Section>

                {/* Section 13 */}
                <Section number="13" title="Severability">
                  <p>
                    If any provision of these Terms is held to be invalid or unenforceable by a court of competent jurisdiction, the remaining provisions of these Terms will remain in effect. The invalid or unenforceable provision will be modified to reflect the parties' original intention as closely as possible.
                  </p>
                </Section>

                {/* Section 14 */}
                <Section number="14" title="Entire Agreement">
                  <p>
                    These Terms, together with our Privacy Policy and any other legal notices published by us on the Service, constitute the entire agreement between you and Shane's Retirement Fund concerning the Service and supersede all prior agreements and understandings.
                  </p>
                </Section>

                {/* Section 15 */}
                <Section number="15" title="Contact Information">
                  <p>If you have any questions about these Terms of Service, please contact us at:</p>
                  <div className="bg-[#EDF6F9] rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 mt-4">
                    <p className="font-black text-[#006D77] mb-2">Shane's Retirement Fund</p>
                    <p className="text-[#006D77]/70 text-sm sm:text-base">Email: <a href="mailto:legal@shanesretirementfund.com" className="text-[#E29578] font-bold hover:underline">legal@shanesretirementfund.com</a></p>
                    <p className="text-[#006D77]/70 text-sm sm:text-base">Support: <a href="mailto:support@shanesretirementfund.com" className="text-[#E29578] font-bold hover:underline">support@shanesretirementfund.com</a></p>
                  </div>
                </Section>

                {/* Acknowledgment */}
                <div className="mt-8 sm:mt-10 pt-8 border-t-2 border-dashed border-[#83C5BE]/20">
                  <h3 className="text-lg sm:text-xl font-black text-[#006D77] mb-4">ACKNOWLEDGMENT</h3>
                  <div className="bg-[#FFDDD2]/30 border-2 border-[#E29578]/20 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6">
                    <p className="text-[#006D77] font-bold text-sm sm:text-base">
                      BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE, UNDERSTOOD THEM, AND AGREE TO BE BOUND BY THEM. IF YOU DO NOT AGREE TO THESE TERMS OF SERVICE, YOU ARE NOT AUTHORIZED TO USE THE SERVICE.
                    </p>
                  </div>
                </div>

                {/* Archival Seal */}
                <div className="pt-10 sm:pt-12 mt-10 sm:mt-12 border-t-2 sm:border-t-4 border-dashed border-[#83C5BE]/15 flex flex-col items-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 sm:border-8 border-[#83C5BE]/15 flex items-center justify-center opacity-30 select-none">
                    <Gavel size={36} className="text-[#006D77]" />
                  </div>
                  <p className="text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.4em] sm:tracking-[0.5em] mt-4">
                    Shane's Fund Archives — Sweetwater Tech
                  </p>
                  <p className="text-center text-[#006D77]/30 font-medium mt-3 italic text-xs sm:text-sm">
                    — End of Terms of Service —
                  </p>
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

const Section: React.FC<{ number: string; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
  <div className="mt-8 sm:mt-10 first:mt-0">
    <h3 className="text-lg sm:text-2xl font-black text-[#006D77] mb-4 pb-3 border-b-2 border-[#83C5BE]/15 flex items-center gap-2 sm:gap-3 tracking-tight">
      <span className="text-[#83C5BE]">{number}.</span> {title}
    </h3>
    <div className="text-[#006D77]/70 font-medium leading-relaxed space-y-3 sm:space-y-4 text-sm sm:text-base [&_ul]:list-disc [&_ul]:pl-5 sm:[&_ul]:pl-6 [&_p]:leading-relaxed">
      {children}
    </div>
  </div>
);

export default TermsOfService;
