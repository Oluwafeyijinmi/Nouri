import React, { useState } from 'react';
import { Search, Globe, Code, ShieldCheck, CheckCircle, ChevronDown, ChevronUp, Copy } from 'lucide-react';

export default function SEOSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const schemaJSON = `{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Nouri",
  "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600",
  "@id": "https://nourideyforyou.com",
  "url": "https://nourideyforyou.com",
  "telephone": "+2347054626118",
  "priceRange": "₦₦",
  "servesCuisine": "Nigerian, Soup, Swallow, Rice, Snacks",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Ibadan, Oyo State",
    "addressLocality": "Ibadan",
    "addressRegion": "Oyo State",
    "addressCountry": "NG"
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    "opens": "16:30",
    "closes": "22:00"
  }
}`;

  const copySchema = () => {
    navigator.clipboard.writeText(schemaJSON);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-12 bg-bento-cream text-bento-text-secondary transition-colors duration-300" id="seo-audit">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6" id="seo-audit-container">
        
        {/* Accordion Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full glass-card hover:scale-[1.01] hover:shadow-md p-5 rounded-3xl flex items-center justify-between transition-all cursor-pointer"
          id="seo-audit-toggle"
        >
          <div className="flex items-center gap-3 text-left" id="seo-toggle-label">
            <div className="bg-bento-olive-dark text-bento-cream p-2.5 rounded-2xl shrink-0 transition-colors" id="seo-toggle-icon">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans text-lg font-bold text-bento-text-primary transition-colors">SEO & Structured Data Audit</h3>
              <p className="text-xs text-bento-text-muted font-light transition-colors">Inspect the schema tags, index configurations, and meta optimizations built for search engines.</p>
            </div>
          </div>
          {isOpen ? <ChevronUp className="w-5 h-5 text-bento-olive-dark" /> : <ChevronDown className="w-5 h-5 text-bento-olive-dark" />}
        </button>

        {/* Accordion Content */}
        {isOpen && (
          <div className="space-y-6 p-4 border border-bento-border rounded-3xl bg-bento-card-bg animate-fadeIn transition-colors duration-300" id="seo-audit-content">
            {/* Meta tags and checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="seo-audit-grid">
              
              {/* Left Column: Core Optimizations */}
              <div className="bg-bento-cream p-5 rounded-2xl border border-bento-border space-y-3.5 transition-colors duration-300" id="seo-left-col">
                <span className="text-xs font-bold text-bento-olive-dark uppercase tracking-wider font-mono block transition-colors">Meta Optimizations Checklist</span>
                
                <div className="space-y-2.5 text-xs text-bento-text-secondary" id="seo-checklist">
                  <div className="flex items-start gap-2.5" id="chk-title">
                    <CheckCircle className="w-4.5 h-4.5 text-bento-olive-dark shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-bento-text-primary block transition-colors">Dynamic & Optimized Title Tag</strong>
                      <span className="text-bento-text-secondary opacity-90">"Nouri | Dinner Made Easy for Busy Professionals - Ibadan, Oyo State" targets exact local intent.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5" id="chk-desc">
                    <CheckCircle className="w-4.5 h-4.5 text-bento-olive-dark shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-bento-text-primary block transition-colors">Semantic HTML Outlines</strong>
                      <span className="text-bento-text-secondary opacity-90">Uses `header`, `section`, `nav`, and `footer` tags ensuring clear accessibility indexing.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5" id="chk-social">
                    <CheckCircle className="w-4.5 h-4.5 text-bento-olive-dark shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-bento-text-primary block transition-colors">Open Graph & Twitter Meta</strong>
                      <span className="text-bento-text-secondary opacity-90">OG Image properties and Card structures configured for rich shares on Facebook, X, and WhatsApp.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5" id="chk-alt">
                    <CheckCircle className="w-4.5 h-4.5 text-bento-olive-dark shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-bento-text-primary block transition-colors">Image Accessibility (Alt tags)</strong>
                      <span className="text-bento-text-secondary opacity-90">All food, reviews, and interactive cards have semantic alternative text descriptive of West African meals.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Schema.org JSON-LD explanation */}
              <div className="bg-bento-cream p-5 rounded-2xl border border-bento-border space-y-3 transition-colors duration-300" id="seo-right-col">
                <span className="text-xs font-bold text-bento-tan-dark uppercase tracking-wider font-mono block transition-colors">Local Schema.org Definition</span>
                <p className="text-xs text-bento-text-muted leading-relaxed font-light transition-colors">
                  Google and other search engines read structured JSON-LD data to show "Rich Snippets" (price range, opening hours, kitchen category) on Google Search and Maps. This page injects the following schema into the HTML header:
                </p>
                <div className="bg-bento-card-bg p-2.5 rounded-xl text-[10px] text-bento-text-muted font-mono border border-bento-border flex flex-wrap gap-1 transition-colors duration-300" id="schema-badges">
                  <span className="bg-bento-olive text-bento-olive-dark px-2 py-0.5 rounded-lg font-bold transition-colors">@type: Restaurant</span>
                  <span className="bg-bento-tan text-bento-tan-dark px-2 py-0.5 rounded-lg font-bold transition-colors">cuisine: Nigerian</span>
                  <span className="bg-bento-gray text-bento-text-secondary px-2 py-0.5 rounded-lg font-bold transition-colors">geo: Ibadan</span>
                </div>
              </div>
            </div>

            {/* Structured Schema Code Block */}
            <div className="space-y-2 bg-bento-cream rounded-2xl border border-bento-border p-4 transition-colors duration-300" id="schema-code-block">
              <div className="flex justify-between items-center" id="schema-code-header">
                <span className="text-xs font-bold font-mono text-bento-text-secondary flex items-center gap-1 transition-colors">
                  <Code className="w-4 h-4 text-bento-olive-dark" /> JSON-LD Script Injected (index.html)
                </span>
                <button
                  onClick={copySchema}
                  className="bg-bento-card-bg hover:bg-bento-gray text-bento-text-secondary text-[10px] font-bold py-1 px-2.5 rounded-xl border border-bento-border flex items-center gap-1 cursor-pointer transition-colors"
                  id="copy-schema-btn"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="text-[10px] text-bento-text-muted font-mono bg-bento-card-bg p-3 rounded-xl border border-bento-border overflow-x-auto max-h-56 transition-colors duration-300" id="schema-code">
                {schemaJSON}
              </pre>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
