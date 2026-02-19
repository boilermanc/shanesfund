import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Eye, Database, UserX, Gavel } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#EDF6F9] relative">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#006D77]/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[50%] h-[50%] bg-[#E29578]/10 blur-[120px] rounded-full" />
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
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-48 sm:h-64 bg-[#006D77]/10 blur-[80px] rounded-full pointer-events-none -z-10" />
              <div className="relative inline-block">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Shield className="text-[#006D77] mx-auto" size={56} />
                </motion.div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-[#E29578] rounded-full border-3 border-[#EDF6F9] flex items-center justify-center text-white text-[8px] sm:text-[9px] font-black">
                  TM
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-[#006D77] tracking-tighter">
                The Guardian's <span className="italic font-serif text-[#E29578]">Pledge</span>
              </h1>
              <p className="text-[#006D77]/50 font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[10px] sm:text-xs">
                Official Privacy Policy — Effective January 31, 2026
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
                  <Lock size={64} />
                </div>
                <h3 className="font-black uppercase text-[10px] tracking-[0.3em] sm:tracking-[0.4em] mb-4 sm:mb-6 text-[#83C5BE]">
                  The Plain Language Summary
                </h3>
                <p className="text-lg sm:text-2xl font-black leading-tight">
                  Your data is yours. We never sell it. We only collect what we need to run the app. You can delete your account and all your data anytime.
                </p>
              </div>
              <div className="p-8 sm:p-12 bg-white border-2 sm:border-4 border-[#83C5BE]/30 rounded-[2.5rem] sm:rounded-[3.5rem] flex flex-col justify-center shadow-xl">
                <h3 className="font-black text-[#006D77]/50 uppercase text-[10px] tracking-[0.3em] sm:tracking-[0.4em] mb-4 sm:mb-6">
                  Core Privacy Pillars
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {[
                    { icon: <UserX size={18} />, text: 'Zero Third-Party Data Selling' },
                    { icon: <Lock size={18} />, text: 'Industry-Standard Encryption' },
                    { icon: <Eye size={18} />, text: 'Transparent Data Practices' },
                    { icon: <Database size={18} />, text: 'Delete Your Data Anytime' }
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
                PRIVACY
              </div>

              <div className="space-y-10 sm:space-y-12">
                {/* Intro */}
                <div className="text-[#006D77]/70 font-medium leading-relaxed text-sm sm:text-base space-y-4">
                  <p>
                    Shane's Retirement Fund ("Company," "we," "us," or "our") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services (collectively, the "Service").
                  </p>
                  <p>
                    Please read this Privacy Policy carefully. By accessing or using the Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, do not use the Service.
                  </p>
                </div>

                {/* Section 1 */}
                <Section number="01" title="Information We Collect">
                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">1.1 Information You Provide Directly</h4>
                  <p>We collect information you voluntarily provide when using the Service, including:</p>
                  <ul className="space-y-2 sm:space-y-3 mt-4">
                    <li><strong>Account Information:</strong> Email address, display name, and password when you create an account.</li>
                    <li><strong>Profile Information:</strong> Profile picture and any other optional information you choose to provide.</li>
                    <li><strong>Pool Information:</strong> Pool names, descriptions, lottery game preferences, and member information.</li>
                    <li><strong>Ticket Information:</strong> Lottery ticket numbers, draw dates, ticket images, and associated pool data.</li>
                    <li><strong>Payment Information:</strong> Billing address and payment details processed through our third-party payment processor (Stripe). We do not directly store credit card numbers.</li>
                    <li><strong>Communications:</strong> Information you provide when contacting customer support or providing feedback.</li>
                  </ul>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">1.2 Information Collected Automatically</h4>
                  <p>When you access or use the Service, we automatically collect certain information, including:</p>
                  <ul className="space-y-2 sm:space-y-3 mt-4">
                    <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers, and mobile network information.</li>
                    <li><strong>Log Information:</strong> Access times, pages viewed, app crashes, and other system activity.</li>
                    <li><strong>Usage Data:</strong> Features used, pools created or joined, tickets entered, and other interactions with the Service.</li>
                    <li><strong>Location Information:</strong> General geographic location based on IP address (we do not collect precise GPS location).</li>
                  </ul>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">1.3 Information from Third Parties</h4>
                  <p>
                    If you choose to sign in using a third-party service (such as Google or Apple), we may receive information from those services, including your name and email address, in accordance with the authorization procedures determined by those services.
                  </p>
                </Section>

                {/* Section 2 */}
                <Section number="02" title="How We Use Your Information">
                  <p>We use the information we collect for the following purposes:</p>
                  <ul className="space-y-2 sm:space-y-3 mt-4">
                    <li><strong>Service Provision:</strong> To provide, maintain, and improve the Service, including processing transactions and managing your account.</li>
                    <li><strong>Communications:</strong> To send you service-related communications, including confirmations, technical notices, security alerts, and support messages.</li>
                    <li><strong>Notifications:</strong> To send push notifications about pool activity, lottery results, and winning tickets (you can opt out in your device settings).</li>
                    <li><strong>Analytics:</strong> To analyze usage patterns and trends to improve the Service and develop new features.</li>
                    <li><strong>Security:</strong> To detect, prevent, and respond to fraud, abuse, security risks, and technical issues.</li>
                    <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
                  </ul>
                </Section>

                {/* Section 3 */}
                <Section number="03" title="Information Sharing & Disclosure">
                  <div className="bg-[#83C5BE]/15 border-2 border-[#83C5BE]/20 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 mb-6">
                    <p className="text-[#006D77] font-black text-sm sm:text-base">
                      We do not sell your personal information.
                    </p>
                  </div>
                  <p>We may share your information in the following circumstances:</p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">3.1 With Pool Members</h4>
                  <p>
                    When you participate in a lottery pool, certain information (such as your display name, profile picture, and contribution status) will be visible to other members of that pool. Ticket images and numbers are shared with all pool members for transparency.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">3.2 With Service Providers</h4>
                  <p>We share information with third-party service providers who perform services on our behalf, including:</p>

                  <div className="overflow-x-auto mt-4 rounded-[1rem] sm:rounded-[1.5rem] border-2 border-[#83C5BE]/15 overflow-hidden">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#EDF6F9]">
                          <th className="border-b-2 border-[#83C5BE]/15 px-4 sm:px-5 py-3 sm:py-4 text-left text-[#006D77] font-black text-sm">Provider</th>
                          <th className="border-b-2 border-[#83C5BE]/15 px-4 sm:px-5 py-3 sm:py-4 text-left text-[#006D77] font-black text-sm">Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#006D77]/70 text-sm">
                        <tr className="border-b border-[#83C5BE]/10">
                          <td className="px-4 sm:px-5 py-3 sm:py-4 font-bold">Supabase</td>
                          <td className="px-4 sm:px-5 py-3 sm:py-4">Database hosting, authentication, and file storage</td>
                        </tr>
                        <tr className="bg-[#EDF6F9]/30 border-b border-[#83C5BE]/10">
                          <td className="px-4 sm:px-5 py-3 sm:py-4 font-bold">Stripe</td>
                          <td className="px-4 sm:px-5 py-3 sm:py-4">Payment processing and subscription management</td>
                        </tr>
                        <tr className="border-b border-[#83C5BE]/10">
                          <td className="px-4 sm:px-5 py-3 sm:py-4 font-bold">Analytics Providers</td>
                          <td className="px-4 sm:px-5 py-3 sm:py-4">Usage analytics and crash reporting</td>
                        </tr>
                        <tr className="bg-[#EDF6F9]/30">
                          <td className="px-4 sm:px-5 py-3 sm:py-4 font-bold">Push Notification Services</td>
                          <td className="px-4 sm:px-5 py-3 sm:py-4">Delivering push notifications</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4 text-xs sm:text-sm">
                    These providers are contractually obligated to protect your information and use it only for the purposes for which it was disclosed.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">3.3 For Legal Reasons</h4>
                  <p>
                    We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency), or when we believe disclosure is necessary to protect our rights, your safety or the safety of others, investigate fraud, or respond to a government request.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">3.4 Business Transfers</h4>
                  <p>
                    If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction. We will notify you via email and/or a prominent notice on our Service of any change in ownership or uses of your personal information.
                  </p>
                </Section>

                {/* Section 4 */}
                <Section number="04" title="Data Security">
                  <p>
                    We implement appropriate technical and organizational security measures designed to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                  </p>
                  <ul className="space-y-2 mt-4">
                    <li>Encryption of data in transit using TLS/SSL protocols</li>
                    <li>Encryption of data at rest</li>
                    <li>Row-level security policies to prevent unauthorized data access</li>
                    <li>Regular security assessments and monitoring</li>
                    <li>Secure password hashing</li>
                  </ul>
                  <div className="bg-[#FFDDD2]/30 border-2 border-[#E29578]/20 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 mt-6">
                    <p className="text-[#006D77] font-medium text-sm sm:text-base">
                      However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
                    </p>
                  </div>
                </Section>

                {/* Section 5 */}
                <Section number="05" title="Data Retention">
                  <p>
                    We retain your personal information for as long as necessary to provide the Service and fulfill the purposes described in this Privacy Policy, unless a longer retention period is required or permitted by law. When you delete your account, we will delete or anonymize your personal information within thirty (30) days, except where we are required to retain certain information for legal, regulatory, or legitimate business purposes.
                  </p>
                  <p className="mt-4">
                    Ticket images and pool records may be retained for a reasonable period after account deletion to support any ongoing pool operations or to resolve disputes.
                  </p>
                </Section>

                {/* Section 6 */}
                <Section number="06" title="Your Rights & Choices">
                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">6.1 Account Information</h4>
                  <p>
                    You may access, update, or delete your account information at any time through your account settings. If you wish to delete your account entirely, you may do so through the app or by contacting us at <a href="mailto:privacy@shanesretirementfund.com" className="text-[#E29578] font-bold hover:underline">privacy@shanesretirementfund.com</a>.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">6.2 Push Notifications</h4>
                  <p>
                    You can opt out of receiving push notifications by adjusting the notification settings on your mobile device or within the app.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">6.3 California Residents (CCPA Rights)</h4>
                  <div className="bg-[#EDF6F9] rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 mt-4">
                    <p className="text-[#006D77] font-medium mb-3 text-sm sm:text-base">If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA):</p>
                    <ul className="space-y-2 text-[#006D77]/70 text-sm">
                      <li><strong>Right to Know:</strong> You have the right to request information about the categories and specific pieces of personal information we have collected about you.</li>
                      <li><strong>Right to Delete:</strong> You have the right to request deletion of your personal information, subject to certain exceptions.</li>
                      <li><strong>Right to Opt-Out:</strong> We do not sell personal information. If this changes, you will have the right to opt out.</li>
                      <li><strong>Right to Non-Discrimination:</strong> You have the right not to receive discriminatory treatment for exercising your CCPA rights.</li>
                    </ul>
                  </div>
                  <p className="mt-4">
                    To exercise these rights, please contact us at <a href="mailto:privacy@shanesretirementfund.com" className="text-[#E29578] font-bold hover:underline">privacy@shanesretirementfund.com</a>. We will verify your identity before processing your request.
                  </p>

                  <h4 className="text-base sm:text-lg font-black text-[#006D77] mt-5 sm:mt-6 mb-3">6.4 European Residents (GDPR Rights)</h4>
                  <div className="bg-[#EDF6F9] rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 mt-4">
                    <p className="text-[#006D77] font-medium mb-3 text-sm sm:text-base">If you are a resident of the European Economic Area (EEA), you have the following rights under the General Data Protection Regulation (GDPR):</p>
                    <ul className="space-y-2 text-[#006D77]/70 text-sm">
                      <li><strong>Right of Access:</strong> You have the right to access your personal data.</li>
                      <li><strong>Right to Rectification:</strong> You have the right to have inaccurate personal data corrected.</li>
                      <li><strong>Right to Erasure:</strong> You have the right to have your personal data deleted.</li>
                      <li><strong>Right to Restrict Processing:</strong> You have the right to restrict the processing of your personal data.</li>
                      <li><strong>Right to Data Portability:</strong> You have the right to receive your personal data in a structured, commonly used format.</li>
                      <li><strong>Right to Object:</strong> You have the right to object to the processing of your personal data.</li>
                    </ul>
                  </div>
                  <p className="mt-4">
                    To exercise these rights, please contact us at <a href="mailto:privacy@shanesretirementfund.com" className="text-[#E29578] font-bold hover:underline">privacy@shanesretirementfund.com</a>.
                  </p>
                </Section>

                {/* Section 7 */}
                <Section number="07" title="Children's Privacy">
                  <p>
                    The Service is not intended for use by individuals under the age of eighteen (18) or the minimum age required to participate in lottery games in their jurisdiction. We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child without parental consent, we will take steps to delete that information. If you believe we may have collected information from a child, please contact us at <a href="mailto:privacy@shanesretirementfund.com" className="text-[#E29578] font-bold hover:underline">privacy@shanesretirementfund.com</a>.
                  </p>
                </Section>

                {/* Section 8 */}
                <Section number="08" title="Third-Party Links & Services">
                  <p>
                    The Service may contain links to third-party websites or services that are not owned or controlled by us. We are not responsible for the privacy practices of such third parties. We encourage you to review the privacy policies of any third-party services you access.
                  </p>
                </Section>

                {/* Section 9 */}
                <Section number="09" title="International Data Transfers">
                  <p>
                    Your information may be transferred to, and maintained on, servers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ from those of your jurisdiction. By using the Service, you consent to such transfer. We will take appropriate safeguards to ensure that your personal information remains protected in accordance with this Privacy Policy.
                  </p>
                </Section>

                {/* Section 10 */}
                <Section number="10" title="Changes to This Privacy Policy">
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top of this policy. For material changes, we will also provide notice through the app or via email. Your continued use of the Service after such modifications constitutes your acknowledgment of the modified Privacy Policy.
                  </p>
                </Section>

                {/* Section 11 */}
                <Section number="11" title="Contact Us">
                  <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:</p>
                  <div className="bg-[#EDF6F9] rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 mt-4">
                    <p className="font-black text-[#006D77] mb-3">Shane's Retirement Fund</p>
                    <p className="text-[#006D77]/70 text-sm sm:text-base">Privacy Inquiries: <a href="mailto:privacy@shanesretirementfund.com" className="text-[#E29578] font-bold hover:underline">privacy@shanesretirementfund.com</a></p>
                    <p className="text-[#006D77]/70 text-sm sm:text-base">General Support: <a href="mailto:support@shanesretirementfund.com" className="text-[#E29578] font-bold hover:underline">support@shanesretirementfund.com</a></p>
                    <p className="text-[#006D77]/70 text-sm sm:text-base">Data Protection Officer: <a href="mailto:dpo@shanesretirementfund.com" className="text-[#E29578] font-bold hover:underline">dpo@shanesretirementfund.com</a></p>
                  </div>
                </Section>

                {/* Section 12 */}
                <Section number="12" title="Data Processing Summary">
                  <p>The following table summarizes the categories of personal information we collect and how we use them:</p>
                  <div className="overflow-x-auto mt-4 rounded-[1rem] sm:rounded-[1.5rem] border-2 border-[#83C5BE]/15 overflow-hidden">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-[#EDF6F9]">
                          <th className="border-b-2 border-[#83C5BE]/15 px-3 sm:px-4 py-3 sm:py-4 text-left text-[#006D77] font-black text-xs sm:text-sm">Category</th>
                          <th className="border-b-2 border-[#83C5BE]/15 px-3 sm:px-4 py-3 sm:py-4 text-left text-[#006D77] font-black text-xs sm:text-sm">Examples</th>
                          <th className="border-b-2 border-[#83C5BE]/15 px-3 sm:px-4 py-3 sm:py-4 text-left text-[#006D77] font-black text-xs sm:text-sm">Purpose</th>
                          <th className="border-b-2 border-[#83C5BE]/15 px-3 sm:px-4 py-3 sm:py-4 text-left text-[#006D77] font-black text-xs sm:text-sm">Legal Basis</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#006D77]/70 text-xs sm:text-sm">
                        <tr className="border-b border-[#83C5BE]/10">
                          <td className="px-3 sm:px-4 py-3 font-bold">Identifiers</td>
                          <td className="px-3 sm:px-4 py-3">Email, name, device ID</td>
                          <td className="px-3 sm:px-4 py-3">Account management</td>
                          <td className="px-3 sm:px-4 py-3">Contract performance</td>
                        </tr>
                        <tr className="bg-[#EDF6F9]/30 border-b border-[#83C5BE]/10">
                          <td className="px-3 sm:px-4 py-3 font-bold">Commercial Info</td>
                          <td className="px-3 sm:px-4 py-3">Subscription data</td>
                          <td className="px-3 sm:px-4 py-3">Billing, support</td>
                          <td className="px-3 sm:px-4 py-3">Contract performance</td>
                        </tr>
                        <tr className="border-b border-[#83C5BE]/10">
                          <td className="px-3 sm:px-4 py-3 font-bold">Internet Activity</td>
                          <td className="px-3 sm:px-4 py-3">Usage data, logs</td>
                          <td className="px-3 sm:px-4 py-3">Analytics, security</td>
                          <td className="px-3 sm:px-4 py-3">Legitimate interest</td>
                        </tr>
                        <tr className="bg-[#EDF6F9]/30">
                          <td className="px-3 sm:px-4 py-3 font-bold">Geolocation</td>
                          <td className="px-3 sm:px-4 py-3">General location (IP)</td>
                          <td className="px-3 sm:px-4 py-3">Compliance, analytics</td>
                          <td className="px-3 sm:px-4 py-3">Legitimate interest</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Section>

                {/* Archival Seal */}
                <div className="pt-10 sm:pt-12 mt-10 sm:mt-12 border-t-2 sm:border-t-4 border-dashed border-[#83C5BE]/15 flex flex-col items-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 sm:border-8 border-[#83C5BE]/15 flex items-center justify-center opacity-30 select-none">
                    <Gavel size={36} className="text-[#006D77]" />
                  </div>
                  <p className="text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.4em] sm:tracking-[0.5em] mt-4">
                    Shane's Fund Archives — Sweetwater Tech
                  </p>
                  <p className="text-center text-[#006D77]/30 font-medium mt-3 italic text-xs sm:text-sm">
                    — End of Privacy Policy —
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

export default PrivacyPolicy;
