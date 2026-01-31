import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface TermsOfServiceProps {
  onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
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
              <FileText size={28} />
            </div>
            <h1 className="shane-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#006D77] mb-3 sm:mb-4">
              Terms of Service
            </h1>
            <p className="text-base sm:text-lg text-[#006D77]/70 font-medium">
              Effective Date: January 31, 2026
            </p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 md:p-12 shadow-sm"
          >
            <div className="prose prose-lg max-w-none legal-content">
              <p className="text-[#006D77]/80 font-medium leading-relaxed mb-6">
                Welcome to Shane's Retirement Fund ("Service," "App," "Platform," "we," "us," or "our"). These Terms of Service ("Terms," "Agreement") constitute a legally binding agreement between you ("User," "you," or "your") and Shane's Retirement Fund governing your access to and use of our mobile application and related services.
              </p>

              <div className="bg-[#FFDDD2]/30 border border-[#E29578]/30 rounded-xl p-4 sm:p-6 mb-8">
                <p className="text-[#006D77] font-bold text-sm sm:text-base">
                  BY ACCESSING OR USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT ACCESS OR USE THE SERVICE.
                </p>
              </div>

              {/* Section 1 */}
              <Section number="1" title="SERVICE DESCRIPTION AND IMPORTANT DISCLAIMERS">
                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">1.1 Nature of Service</h4>
                <p>
                  Shane's Retirement Fund is a <strong>management and organizational tool only</strong>. The Service assists users in organizing lottery pools, tracking lottery ticket information, managing pool membership, and calculating potential winnings shares.
                </p>

                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">1.2 Critical Disclaimers</h4>
                <p className="font-semibold text-[#006D77] mb-4">YOU EXPRESSLY UNDERSTAND AND AGREE THAT:</p>
                <ul className="space-y-3">
                  <li><strong>(a) We do not purchase lottery tickets.</strong> Users are solely responsible for purchasing all lottery tickets through authorized lottery retailers.</li>
                  <li><strong>(b) We do not handle, collect, transfer, or distribute money</strong> related to lottery pool contributions, ticket purchases, or winnings between users. All financial transactions between pool members are conducted independently and outside of our Service.</li>
                  <li><strong>(c) We are not a gambling operator,</strong> lottery retailer, lottery courier, or money transmitter. We do not facilitate gambling transactions.</li>
                  <li><strong>(d) We are not responsible for the distribution of lottery winnings.</strong> Users must independently arrange and execute any distribution of prize money among pool members.</li>
                  <li><strong>(e) We do not guarantee the accuracy of lottery results.</strong> While we make reasonable efforts to provide accurate lottery information, users must independently verify all lottery results through official lottery sources.</li>
                  <li><strong>(f) Users are solely responsible for compliance with all applicable laws</strong> regarding lottery participation in their jurisdiction.</li>
                </ul>
              </Section>

              {/* Section 2 */}
              <Section number="2" title="ELIGIBILITY AND ACCOUNT REGISTRATION">
                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">2.1 Age Requirement</h4>
                <p>
                  You must be at least eighteen (18) years of age, or the minimum age required to participate in lottery games in your jurisdiction (whichever is higher), to use this Service. By using the Service, you represent and warrant that you meet this age requirement.
                </p>

                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">2.2 Geographic Restrictions</h4>
                <p>
                  The Service is intended for use only in jurisdictions where lottery participation is legal. You represent and warrant that you are located in a jurisdiction where lottery games are legally permitted and that your use of the Service does not violate any applicable laws.
                </p>

                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">2.3 Account Registration</h4>
                <p>
                  To access certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your account credentials and for all activities that occur under your account.
                </p>
              </Section>

              {/* Section 3 */}
              <Section number="3" title="SUBSCRIPTION AND PAYMENT TERMS">
                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">3.1 Subscription Tiers</h4>
                <p>
                  The Service offers both free and paid subscription tiers. Paid subscriptions ("Premium" and "Pro") provide access to enhanced features as described on our pricing page. Feature availability may vary by subscription tier.
                </p>

                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">3.2 Billing and Payment</h4>
                <p>
                  Paid subscriptions are billed in advance on a monthly or annual basis, as selected at the time of purchase. Payment processing is handled by our third-party payment processor, Stripe, Inc. By subscribing, you authorize us to charge your designated payment method for recurring subscription fees.
                </p>

                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">3.3 Automatic Renewal</h4>
                <p>
                  <strong>SUBSCRIPTIONS AUTOMATICALLY RENEW</strong> at the end of each billing period unless cancelled prior to the renewal date. You may cancel your subscription at any time through your account settings or by contacting customer support.
                </p>

                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">3.4 Refund Policy</h4>
                <p>
                  Subscription fees are generally non-refundable except as required by applicable law. If you cancel your subscription, you will continue to have access to paid features until the end of your current billing period.
                </p>

                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">3.5 Price Changes</h4>
                <p>
                  We reserve the right to modify subscription prices at any time. Price changes will not affect your current subscription period but will apply upon renewal. We will provide reasonable notice of any price increases.
                </p>
              </Section>

              {/* Section 4 */}
              <Section number="4" title="USER CONDUCT AND RESPONSIBILITIES">
                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">4.1 Pool Captain Responsibilities</h4>
                <p>
                  Users who create lottery pools ("Pool Captains") assume responsibility for the accurate entry of ticket information, proper management of pool membership, and fair treatment of pool members. Pool Captains acknowledge that they are solely responsible for any disputes arising within their pools.
                </p>

                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">4.2 Prohibited Conduct</h4>
                <p>You agree not to:</p>
                <ul className="space-y-2 mt-3">
                  <li>(a) Use the Service for any unlawful purpose or in violation of any applicable laws or regulations;</li>
                  <li>(b) Provide false, misleading, or fraudulent information;</li>
                  <li>(c) Attempt to gain unauthorized access to any portion of the Service or any systems or networks connected to the Service;</li>
                  <li>(d) Interfere with or disrupt the integrity or performance of the Service;</li>
                  <li>(e) Create multiple accounts for fraudulent purposes;</li>
                  <li>(f) Use the Service to harass, abuse, or harm other users.</li>
                </ul>
              </Section>

              {/* Section 5 */}
              <Section number="5" title="INTELLECTUAL PROPERTY">
                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">5.1 Ownership</h4>
                <p>
                  The Service and its original content, features, and functionality are and will remain the exclusive property of Shane's Retirement Fund and its licensors. The Service is protected by copyright, trademark, and other laws of the United States and foreign countries.
                </p>

                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">5.2 License to Use</h4>
                <p>
                  Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your personal, non-commercial purposes.
                </p>

                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">5.3 User Content</h4>
                <p>
                  You retain ownership of any content you submit to the Service (such as ticket images and pool information). By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, store, and display such content solely for the purpose of providing and improving the Service.
                </p>
              </Section>

              {/* Section 6 */}
              <Section number="6" title="DISCLAIMER OF WARRANTIES">
                <div className="bg-[#EDF6F9] rounded-xl p-4 sm:p-6 mt-4">
                  <p className="text-[#006D77] font-semibold">
                    THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
                  </p>
                </div>
                <p className="mt-4">
                  We do not warrant that: (a) the Service will function uninterrupted, secure, or available at any particular time or location; (b) any errors or defects will be corrected; (c) the Service is free of viruses or other harmful components; (d) the results of using the Service will meet your requirements; or (e) lottery results or winning calculations displayed within the Service are accurate or complete.
                </p>
              </Section>

              {/* Section 7 */}
              <Section number="7" title="LIMITATION OF LIABILITY">
                <div className="bg-[#EDF6F9] rounded-xl p-4 sm:p-6 mt-4">
                  <p className="text-[#006D77] font-semibold mb-4">
                    TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL SHANE'S RETIREMENT FUND, ITS DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, PARTNERS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION:
                  </p>
                  <ul className="space-y-2 text-[#006D77]/80">
                    <li>(a) Loss of profits, data, use, goodwill, or other intangible losses;</li>
                    <li>(b) Any failure to distribute or properly allocate lottery winnings among pool members;</li>
                    <li>(c) Any disputes between pool members regarding contributions or winnings;</li>
                    <li>(d) Inaccurate lottery results or winning calculations;</li>
                    <li>(e) Failure to properly record, scan, or store ticket information;</li>
                    <li>(f) Any other matter relating to the Service.</li>
                  </ul>
                </div>
                <p className="mt-4 font-semibold text-[#006D77]">
                  OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING TO THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US, IF ANY, DURING THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE DATE OF THE CLAIM.
                </p>
              </Section>

              {/* Section 8 */}
              <Section number="8" title="INDEMNIFICATION">
                <p>
                  You agree to defend, indemnify, and hold harmless Shane's Retirement Fund and its officers, directors, employees, agents, licensors, and suppliers from and against any claims, actions, or demands, including without limitation reasonable legal and accounting fees, arising from or related to: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party rights; (d) any dispute between you and other pool members; or (e) your violation of any applicable laws or regulations.
                </p>
              </Section>

              {/* Section 9 */}
              <Section number="9" title="DISPUTE RESOLUTION">
                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">9.1 Informal Resolution</h4>
                <p>
                  Before filing a claim against us, you agree to attempt to resolve the dispute informally by contacting us at legal@shanesretirementfund.com. We will attempt to resolve the dispute informally within sixty (60) days.
                </p>

                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">9.2 Binding Arbitration</h4>
                <p>
                  If informal resolution is unsuccessful, any dispute, controversy, or claim arising out of or relating to these Terms shall be resolved by binding arbitration administered by the American Arbitration Association ("AAA") in accordance with its Commercial Arbitration Rules. The arbitration shall be conducted in Delaware, unless otherwise agreed by the parties.
                </p>

                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">9.3 Class Action Waiver</h4>
                <div className="bg-[#FFDDD2]/30 border border-[#E29578]/30 rounded-xl p-4 sm:p-6 mt-4">
                  <p className="text-[#006D77] font-bold">
                    YOU AND SHANE'S RETIREMENT FUND AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
                  </p>
                </div>
              </Section>

              {/* Section 10 */}
              <Section number="10" title="TERMINATION">
                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">10.1 Termination by You</h4>
                <p>
                  You may terminate your account at any time by deleting your account through the app settings or by contacting customer support. Upon termination, your right to use the Service will immediately cease.
                </p>

                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">10.2 Termination by Us</h4>
                <p>
                  We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms. Upon termination, your right to use the Service will immediately cease.
                </p>

                <h4 className="text-lg font-bold text-[#006D77] mt-6 mb-3">10.3 Effect of Termination</h4>
                <p>
                  Upon termination, all provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnification, and limitations of liability.
                </p>
              </Section>

              {/* Section 11 */}
              <Section number="11" title="GOVERNING LAW">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                </p>
              </Section>

              {/* Section 12 */}
              <Section number="12" title="CHANGES TO TERMS">
                <p>
                  We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will provide at least thirty (30) days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms.
                </p>
              </Section>

              {/* Section 13 */}
              <Section number="13" title="SEVERABILITY">
                <p>
                  If any provision of these Terms is held to be invalid or unenforceable by a court of competent jurisdiction, the remaining provisions of these Terms will remain in effect. The invalid or unenforceable provision will be modified to reflect the parties' original intention as closely as possible.
                </p>
              </Section>

              {/* Section 14 */}
              <Section number="14" title="ENTIRE AGREEMENT">
                <p>
                  These Terms, together with our Privacy Policy and any other legal notices published by us on the Service, constitute the entire agreement between you and Shane's Retirement Fund concerning the Service and supersede all prior agreements and understandings.
                </p>
              </Section>

              {/* Section 15 */}
              <Section number="15" title="CONTACT INFORMATION">
                <p>If you have any questions about these Terms of Service, please contact us at:</p>
                <div className="bg-[#EDF6F9] rounded-xl p-4 sm:p-6 mt-4">
                  <p className="font-bold text-[#006D77] mb-2">Shane's Retirement Fund</p>
                  <p className="text-[#006D77]/80">Email: <a href="mailto:legal@shanesretirementfund.com" className="text-[#E29578] hover:underline">legal@shanesretirementfund.com</a></p>
                  <p className="text-[#006D77]/80">Support: <a href="mailto:support@shanesretirementfund.com" className="text-[#E29578] hover:underline">support@shanesretirementfund.com</a></p>
                </div>
              </Section>

              {/* Acknowledgment */}
              <div className="mt-10 pt-8 border-t border-[#006D77]/10">
                <h3 className="text-xl font-bold text-[#006D77] mb-4">ACKNOWLEDGMENT</h3>
                <div className="bg-[#FFDDD2]/30 border border-[#E29578]/30 rounded-xl p-4 sm:p-6">
                  <p className="text-[#006D77] font-semibold">
                    BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE, UNDERSTOOD THEM, AND AGREE TO BE BOUND BY THEM. IF YOU DO NOT AGREE TO THESE TERMS OF SERVICE, YOU ARE NOT AUTHORIZED TO USE THE SERVICE.
                  </p>
                </div>
              </div>

              <p className="text-center text-[#006D77]/50 font-medium mt-10 italic">
                — END OF TERMS OF SERVICE —
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Section component for consistent styling
const Section: React.FC<{ number: string; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
  <div className="mt-10 first:mt-0">
    <h3 className="text-xl sm:text-2xl font-bold text-[#006D77] mb-4 pb-2 border-b border-[#006D77]/10">
      {number}. {title}
    </h3>
    <div className="text-[#006D77]/80 font-medium leading-relaxed space-y-4 [&_ul]:list-disc [&_ul]:pl-6 [&_p]:leading-relaxed">
      {children}
    </div>
  </div>
);

export default TermsOfService;
