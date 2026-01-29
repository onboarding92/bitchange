import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            <strong>Last Updated:</strong> January 29, 2026
          </p>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p>
              BitChange Pro ("we", "our", or "us") operates the website bitchangemoney.xyz (the "Service"). 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
              you use our cryptocurrency exchange platform. We are committed to protecting your privacy and 
              complying with the General Data Protection Regulation (GDPR) and other applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Personal Information</h3>
            <p>When you register for an account, we collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email address</li>
              <li>Full name</li>
              <li>Password (encrypted)</li>
              <li>Date of birth</li>
              <li>Residential address</li>
              <li>Phone number</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.2 KYC (Know Your Customer) Information</h3>
            <p>To comply with anti-money laundering (AML) regulations, we collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Government-issued identification documents (passport, ID card, driver's license)</li>
              <li>Proof of address documents</li>
              <li>Selfie photographs for identity verification</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Transaction Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cryptocurrency wallet addresses</li>
              <li>Transaction history (deposits, withdrawals, trades)</li>
              <li>Staking positions and rewards</li>
              <li>Payment information</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.4 Technical Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Log data (access times, pages viewed)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use your personal information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Management:</strong> To create and manage your account</li>
              <li><strong>KYC/AML Compliance:</strong> To verify your identity and comply with legal obligations</li>
              <li><strong>Transaction Processing:</strong> To process deposits, withdrawals, and trades</li>
              <li><strong>Security:</strong> To detect and prevent fraud, unauthorized access, and illegal activities</li>
              <li><strong>Customer Support:</strong> To respond to your inquiries and provide assistance</li>
              <li><strong>Service Improvement:</strong> To analyze usage patterns and improve our platform</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
              <li><strong>Marketing:</strong> To send you promotional materials (with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Legal Basis for Processing (GDPR)</h2>
            <p>Under GDPR, we process your personal data based on the following legal grounds:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Contractual Necessity:</strong> Processing is necessary to perform our contract with you (providing exchange services)</li>
              <li><strong>Legal Obligation:</strong> Processing is required to comply with KYC/AML regulations</li>
              <li><strong>Legitimate Interest:</strong> Processing is necessary for fraud prevention and security</li>
              <li><strong>Consent:</strong> For marketing communications and optional data processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Sharing and Disclosure</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> Third-party vendors who assist us in operating our platform (hosting, payment processing, KYC verification)</li>
              <li><strong>Legal Authorities:</strong> Law enforcement, regulators, or courts when required by law</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
            </ul>
            <p className="mt-4">
              We do not sell your personal information to third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services and comply 
              with legal obligations. Specifically:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Data:</strong> Retained while your account is active and for 7 years after account closure (AML compliance)</li>
              <li><strong>KYC Documents:</strong> Retained for 7 years after account closure (regulatory requirement)</li>
              <li><strong>Transaction Records:</strong> Retained for 7 years (tax and regulatory compliance)</li>
              <li><strong>Technical Logs:</strong> Retained for 12 months</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Your Rights (GDPR)</h2>
            <p>Under GDPR, you have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your data (subject to legal retention requirements)</li>
              <li><strong>Right to Restriction:</strong> Request limitation of processing</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for marketing communications</li>
            </ul>
            <p className="mt-4">
              To exercise your rights, contact us at: <a href="mailto:privacy@bitchangemoney.xyz" className="text-primary hover:underline">privacy@bitchangemoney.xyz</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of sensitive data (passwords, private keys)</li>
              <li>Secure HTTPS connections</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Automated daily backups</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the internet is 100% secure. While we strive to protect 
              your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. International Data Transfers</h2>
            <p>
              Our servers are located in Germany (EU). If you access our Service from outside the European Economic 
              Area (EEA), your data may be transferred to and processed in the EU. We ensure that such transfers 
              comply with GDPR requirements through appropriate safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar technologies to enhance your experience. For detailed information about 
              our cookie practices, please see our <Link href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Children's Privacy</h2>
            <p>
              Our Service is not intended for individuals under the age of 18. We do not knowingly collect 
              personal information from children. If you become aware that a child has provided us with personal 
              data, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes 
              by posting the new policy on this page and updating the "Last Updated" date. Your continued use 
              of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
            </p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>Email:</strong> <a href="mailto:privacy@bitchangemoney.xyz" className="text-primary hover:underline">privacy@bitchangemoney.xyz</a></li>
              <li><strong>Support:</strong> <a href="mailto:support@bitchangemoney.xyz" className="text-primary hover:underline">support@bitchangemoney.xyz</a></li>
              <li><strong>Website:</strong> <a href="https://bitchangemoney.xyz" className="text-primary hover:underline">bitchangemoney.xyz</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">14. Supervisory Authority</h2>
            <p>
              If you believe we have not addressed your concerns adequately, you have the right to lodge a 
              complaint with your local data protection authority or the German Federal Commissioner for Data 
              Protection and Freedom of Information (BfDI).
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            © 2026 BitChange Pro. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
