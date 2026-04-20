import Script from "next/script";
import "./globals.css";

const GA_ID = "G-2YHG89FY0N";
const TOOL_NAME = "deduction-repeal-analysis";

const SITE_URL = "https://deduction-repeal-analysis.policyengine.org";
const SITE_TITLE = "Deduction Repeal Analysis | PolicyEngine";
const SITE_DESCRIPTION =
  "Interactive 10-year federal revenue scores for repealing US tax deductions (2026-2035), with CBO behavioral responses and revenue-neutral UBI recycling. Built with PolicyEngine microsimulation.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: { icon: "/favicon.svg" },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "PolicyEngine",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Deduction Repeal Analysis - 10-year federal revenue projections chart",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: "@ThePolicyEngine",
    creator: "@ThePolicyEngine",
    images: [`${SITE_URL}/og-image.png`],
  },
  other: {
    "theme-color": "#2C7A7B",
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Deduction Repeal Analysis",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    applicationCategory: "FinanceApplication",
    operatingSystem: "All",
    author: {
      "@type": "Organization",
      name: "PolicyEngine",
      url: "https://policyengine.org",
    },
    publisher: {
      "@type": "Organization",
      name: "PolicyEngine",
      url: "https://policyengine.org",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/favicon.svg`,
      },
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    about: {
      "@type": "GovernmentService",
      name: "US Federal Tax Deduction Repeal Revenue Analysis",
      description:
        "Microsimulation-based 10-year revenue scores for repealing itemized and standard deductions in the US tax code, covering 2026-2035.",
    },
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { tool_name: '${TOOL_NAME}' });
          `}
        </Script>
        <Script id="engagement-tracking" strategy="afterInteractive">
          {`
            (function() {
              var TOOL_NAME = '${TOOL_NAME}';
              if (typeof window === 'undefined' || !window.gtag) return;

              var scrollFired = {};
              window.addEventListener('scroll', function() {
                var docHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (docHeight <= 0) return;
                var pct = Math.floor((window.scrollY / docHeight) * 100);
                [25, 50, 75, 100].forEach(function(m) {
                  if (pct >= m && !scrollFired[m]) {
                    scrollFired[m] = true;
                    window.gtag('event', 'scroll_depth', { percent: m, tool_name: TOOL_NAME });
                  }
                });
              }, { passive: true });

              [30, 60, 120, 300].forEach(function(sec) {
                setTimeout(function() {
                  if (document.visibilityState !== 'hidden') {
                    window.gtag('event', 'time_on_tool', { seconds: sec, tool_name: TOOL_NAME });
                  }
                }, sec * 1000);
              });

              document.addEventListener('click', function(e) {
                var link = e.target && e.target.closest ? e.target.closest('a') : null;
                if (!link || !link.href) return;
                try {
                  var url = new URL(link.href, window.location.origin);
                  if (url.hostname && url.hostname !== window.location.hostname) {
                    window.gtag('event', 'outbound_click', {
                      url: link.href,
                      target_hostname: url.hostname,
                      tool_name: TOOL_NAME
                    });
                  }
                } catch (err) {}
              });
            })();
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
