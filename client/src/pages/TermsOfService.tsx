import { Link } from "wouter";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            <strong>Last Updated:</strong> January 29, 2026
          </p>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using BitChange Pro ("the Service"), you agree to be bound by these Terms of Service 
              ("Terms"). If you do not agree to these Terms, you may not use the Service. These Terms constitute a 
              legally binding agreement between you and BitChange Pro.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Eligibility</h2>
            <p>To use our Service, you must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be located in a jurisdiction where cryptocurrency trading is prohibited</li>
              <li>Not be on any sanctions list or prohibited from using our services under applicable law</li>
              <li>Complete our Know Your Customer (KYC) verification process</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Account Registration</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Account Creation</h3>
            <p>
              To use our Service, you must create an account by providing accurate, complete, and current information. 
              You are responsible for maintaining the confidentiality of your account credentials and for all activities 
              that occur under your account.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 KYC Verification</h3>
            <p>
              We are required by law to verify your identity. You must provide valid identification documents and 
              complete our KYC process before you can deposit, withdraw, or trade cryptocurrencies. We reserve the 
              right to request additional documentation at any time.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Account Security</h3>
            <p>
              You must immediately notify us of any unauthorized access to your account. We are not liable for any 
              losses resulting from unauthorized use of your account if you fail to maintain adequate security measures.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Services Provided</h2>
            <p>BitChange Pro provides the following services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cryptocurrency Exchange:</strong> Buy, sell, and trade digital assets</li>
              <li><strong>Wallet Services:</strong> Store and manage your cryptocurrencies</li>
              <li><strong>Staking Services:</strong> Earn rewards by staking supported cryptocurrencies</li>
              <li><strong>Deposit and Withdrawal:</strong> Transfer funds to and from your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Fees and Charges</h2>
            <p>
              We charge fees for certain services, including trading, deposits, and withdrawals. All fees are 
              displayed on our platform before you complete a transaction. We reserve the right to modify our fee 
              structure at any time with prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Trading and Transactions</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Order Execution</h3>
            <p>
              All trades are executed at the prevailing market price at the time of execution. We do not guarantee 
              that orders will be filled at a specific price. Market conditions may result in price slippage.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Transaction Limits</h3>
            <p>
              We may impose limits on transaction amounts, frequency, and withdrawal amounts based on your account 
              verification level and regulatory requirements.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Irreversibility</h3>
            <p>
              Cryptocurrency transactions are irreversible. Once a transaction is confirmed on the blockchain, it 
              cannot be reversed. You are responsible for ensuring the accuracy of all transaction details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Deposits and Withdrawals</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Deposits</h3>
            <p>
              You may deposit cryptocurrencies to your account using the wallet addresses provided. We are not 
              responsible for funds sent to incorrect addresses or using unsupported networks.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Withdrawals</h3>
            <p>
              Withdrawal requests are subject to manual review and may take up to 24-48 hours to process. We reserve 
              the right to delay or reject withdrawals if we suspect fraudulent activity or regulatory violations.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Network Fees</h3>
            <p>
              Blockchain network fees (gas fees) are deducted from your withdrawal amount. These fees are determined 
              by the respective blockchain networks and are beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Staking Services</h2>
            <p>
              Our staking services allow you to earn rewards by locking your cryptocurrencies for a specified period. 
              Staking rewards are calculated based on the Annual Percentage Rate (APR) and the duration of the staking 
              period. Locked staking positions cannot be withdrawn before the maturity date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Prohibited Activities</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any illegal activities, including money laundering or terrorist financing</li>
              <li>Manipulate market prices or engage in fraudulent trading practices</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Use automated trading bots without our prior written consent</li>
              <li>Provide false or misleading information during registration or KYC verification</li>
              <li>Violate any applicable laws, regulations, or third-party rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Risk Disclosure</h2>
            <p>
              <strong>Cryptocurrency trading involves significant risk.</strong> The value of cryptocurrencies can 
              fluctuate dramatically, and you may lose all or part of your investment. You should only invest funds 
              that you can afford to lose. We do not provide investment advice, and you are solely responsible for 
              your trading decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, BitChange Pro shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from 
              your use of the Service. Our total liability shall not exceed the fees you paid to us in the 12 months 
              preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless BitChange Pro, its affiliates, and their respective officers, 
              directors, employees, and agents from any claims, losses, damages, liabilities, and expenses arising 
              from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Account Suspension and Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for any reason, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violation of these Terms</li>
              <li>Suspected fraudulent or illegal activity</li>
              <li>Failure to complete KYC verification</li>
              <li>Regulatory or legal requirements</li>
            </ul>
            <p className="mt-4">
              Upon termination, you may withdraw your funds, subject to applicable fees and regulatory requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">14. Intellectual Property</h2>
            <p>
              All content, trademarks, logos, and intellectual property on the Service are owned by BitChange Pro or 
              its licensors. You may not use, reproduce, or distribute any content without our prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">15. Privacy</h2>
            <p>
              Your use of the Service is subject to our <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>, 
              which explains how we collect, use, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">16. Dispute Resolution</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">16.1 Governing Law</h3>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Germany, without regard 
              to its conflict of law provisions.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">16.2 Arbitration</h3>
            <p>
              Any disputes arising from these Terms or your use of the Service shall be resolved through binding 
              arbitration in accordance with the rules of the German Arbitration Institute (DIS), unless otherwise 
              required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">17. Force Majeure</h2>
            <p>
              We shall not be liable for any failure or delay in performing our obligations due to circumstances 
              beyond our reasonable control, including natural disasters, war, terrorism, cyberattacks, government 
              actions, or blockchain network failures.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">18. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material changes by 
              posting the updated Terms on our website and updating the "Last Updated" date. Your continued use of 
              the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">19. Severability</h2>
            <p>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions 
              shall remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">20. Contact Information</h2>
            <p>
              If you have questions about these Terms, please contact us:
            </p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>Email:</strong> <a href="mailto:legal@bitchangemoney.xyz" className="text-primary hover:underline">legal@bitchangemoney.xyz</a></li>
              <li><strong>Support:</strong> <a href="mailto:support@bitchangemoney.xyz" className="text-primary hover:underline">support@bitchangemoney.xyz</a></li>
              <li><strong>Website:</strong> <a href="https://bitchangemoney.xyz" className="text-primary hover:underline">bitchangemoney.xyz</a></li>
            </ul>
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
