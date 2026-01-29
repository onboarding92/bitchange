import { Link } from "wouter";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            <strong>Last Updated:</strong> January 29, 2026
          </p>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you 
              visit a website. They are widely used to make websites work more efficiently and provide information to 
              the website owners. Cookies help us understand how you use our platform and improve your experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Cookies</h2>
            <p>BitChange Pro uses cookies for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for the platform to function properly (e.g., authentication, session management)</li>
              <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our platform by collecting anonymous usage data</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences and settings (e.g., language, theme)</li>
              <li><strong>Security Cookies:</strong> Detect and prevent fraudulent activity and unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Strictly Necessary Cookies</h3>
            <p>
              These cookies are essential for the operation of our platform. They enable core functionality such as 
              security, authentication, and session management. Without these cookies, the platform cannot function 
              properly. These cookies do not collect personal information.
            </p>
            <div className="bg-card p-4 rounded-lg mt-4">
              <p className="text-sm"><strong>Examples:</strong></p>
              <ul className="list-disc pl-6 text-sm space-y-1 mt-2">
                <li><code>session_id</code> - Maintains your login session</li>
                <li><code>csrf_token</code> - Protects against cross-site request forgery attacks</li>
                <li><code>auth_token</code> - Authenticates your identity</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Performance and Analytics Cookies</h3>
            <p>
              These cookies collect information about how visitors use our platform, such as which pages are visited 
              most often and if users receive error messages. This data is aggregated and anonymous, helping us improve 
              the platform's performance and user experience.
            </p>
            <div className="bg-card p-4 rounded-lg mt-4">
              <p className="text-sm"><strong>Examples:</strong></p>
              <ul className="list-disc pl-6 text-sm space-y-1 mt-2">
                <li><code>_ga</code> - Google Analytics (tracks page views and user behavior)</li>
                <li><code>_gid</code> - Google Analytics (distinguishes users)</li>
                <li><code>analytics_session</code> - Tracks session duration and interactions</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Functional Cookies</h3>
            <p>
              These cookies allow the platform to remember choices you make (such as your preferred language or theme) 
              and provide enhanced, personalized features.
            </p>
            <div className="bg-card p-4 rounded-lg mt-4">
              <p className="text-sm"><strong>Examples:</strong></p>
              <ul className="list-disc pl-6 text-sm space-y-1 mt-2">
                <li><code>theme_preference</code> - Remembers your dark/light mode preference</li>
                <li><code>language</code> - Stores your language selection</li>
                <li><code>currency_preference</code> - Remembers your preferred display currency</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Security Cookies</h3>
            <p>
              These cookies help us detect and prevent security threats, fraudulent activity, and unauthorized access 
              to user accounts.
            </p>
            <div className="bg-card p-4 rounded-lg mt-4">
              <p className="text-sm"><strong>Examples:</strong></p>
              <ul className="list-disc pl-6 text-sm space-y-1 mt-2">
                <li><code>security_token</code> - Verifies legitimate requests</li>
                <li><code>device_fingerprint</code> - Detects suspicious login attempts</li>
                <li><code>rate_limit</code> - Prevents automated attacks</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Third-Party Cookies</h2>
            <p>
              We may use third-party services that set cookies on your device. These services help us provide better 
              functionality and analyze platform usage. Third-party cookies are subject to the respective third party's 
              privacy policies.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Google Analytics:</strong> Tracks website traffic and user behavior</li>
              <li><strong>Payment Processors:</strong> Facilitate secure payment transactions</li>
              <li><strong>KYC Verification Services:</strong> Verify user identity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Cookie Duration</h2>
            <p>Cookies can be either session cookies or persistent cookies:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Session Cookies:</strong> Temporary cookies that are deleted when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Remain on your device for a specified period or until you delete them</li>
            </ul>
            <div className="bg-card p-4 rounded-lg mt-4">
              <p className="text-sm"><strong>Typical Cookie Durations:</strong></p>
              <ul className="list-disc pl-6 text-sm space-y-1 mt-2">
                <li>Authentication cookies: 30 days</li>
                <li>Preference cookies: 1 year</li>
                <li>Analytics cookies: 2 years</li>
                <li>Security cookies: Session-based (deleted on logout)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Managing Cookies</h2>
            <p>
              You have the right to accept or reject cookies. You can manage your cookie preferences through your 
              browser settings or by using our cookie consent banner when you first visit the platform.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Browser Settings</h3>
            <p>Most web browsers allow you to control cookies through their settings. You can:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>View and delete cookies</li>
              <li>Block all cookies</li>
              <li>Block third-party cookies</li>
              <li>Clear cookies when you close your browser</li>
            </ul>
            <p className="mt-4">
              <strong>Note:</strong> Blocking essential cookies may prevent you from using certain features of the platform.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Browser-Specific Instructions</h3>
            <div className="bg-card p-4 rounded-lg mt-4">
              <ul className="list-none space-y-2 text-sm">
                <li><strong>Google Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                <li><strong>Mozilla Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                <li><strong>Microsoft Edge:</strong> Settings → Cookies and site permissions → Cookies and data stored</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Opt-Out of Analytics</h3>
            <p>
              To opt out of Google Analytics tracking, you can install the{" "}
              <a 
                href="https://tools.google.com/dlpage/gaoptout" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Analytics Opt-out Browser Add-on
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Do Not Track (DNT)</h2>
            <p>
              Some browsers include a "Do Not Track" (DNT) feature that signals to websites that you do not want your 
              online activity tracked. Currently, there is no universal standard for how DNT signals should be interpreted. 
              We do not currently respond to DNT signals, but we respect your privacy choices through our cookie consent 
              mechanism.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Changes to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our 
              business practices. We will notify you of any material changes by posting the updated policy on this page 
              and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact Us</h2>
            <p>
              If you have questions about our use of cookies, please contact us:
            </p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>Email:</strong> <a href="mailto:privacy@bitchangemoney.xyz" className="text-primary hover:underline">privacy@bitchangemoney.xyz</a></li>
              <li><strong>Support:</strong> <a href="mailto:support@bitchangemoney.xyz" className="text-primary hover:underline">support@bitchangemoney.xyz</a></li>
              <li><strong>Website:</strong> <a href="https://bitchangemoney.xyz" className="text-primary hover:underline">bitchangemoney.xyz</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Additional Resources</h2>
            <p>For more information about cookies and how to manage them, visit:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <a 
                  href="https://www.allaboutcookies.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  All About Cookies
                </a>
              </li>
              <li>
                <a 
                  href="https://www.youronlinechoices.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Your Online Choices (EU)
                </a>
              </li>
              <li>
                <a 
                  href="https://ico.org.uk/for-the-public/online/cookies/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  UK Information Commissioner's Office (ICO) - Cookies
                </a>
              </li>
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
