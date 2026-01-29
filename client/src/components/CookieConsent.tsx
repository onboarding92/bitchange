import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Link } from "wouter";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Show banner after 1 second delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "accepted");
    localStorage.setItem("cookie_consent_date", new Date().toISOString());
    setIsVisible(false);
  };

  const rejectCookies = () => {
    localStorage.setItem("cookie_consent", "rejected");
    localStorage.setItem("cookie_consent_date", new Date().toISOString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg animate-in slide-in-from-bottom duration-500">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">🍪 We Use Cookies</h3>
            <p className="text-sm text-muted-foreground">
              We use cookies to enhance your experience, analyze site traffic, and provide personalized content. 
              By clicking "Accept All", you consent to our use of cookies. You can manage your preferences in your 
              browser settings.{" "}
              <Link href="/cookie-policy" className="text-primary hover:underline">
                Learn more
              </Link>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link 
              href="/privacy-policy" 
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Privacy Policy
            </Link>
            <button
              onClick={rejectCookies}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Reject
            </button>
            <button
              onClick={acceptCookies}
              className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
