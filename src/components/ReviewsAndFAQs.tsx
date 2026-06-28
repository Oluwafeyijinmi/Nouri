import React, { useState } from 'react';
import { Star, MessageSquare, HelpCircle, ChevronDown, ChevronUp, Phone, Mail, MapPin, Clock, Heart } from 'lucide-react';
import { WORK_CLASS_REVIEWS, FAQ_ITEMS } from '../data';

export default function ReviewsAndFAQs() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div id="reviews-and-faqs" className="bg-bento-cream text-bento-text-secondary transition-colors duration-300">
      {/* 1. REVIEWS SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12" id="reviews">
        {/* Soft elegant top divider */}
        <div className="flex justify-center items-center gap-1.5 pb-4" id="reviews-top-divider">
          <span className="w-1.5 h-1.5 rounded-full bg-bento-olive-dark opacity-30"></span>
          <span className="w-12 h-[1px] bg-bento-border"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-bento-olive-dark opacity-30"></span>
        </div>

        <div className="text-center space-y-3 max-w-2xl mx-auto" id="reviews-heading-block">
          <span className="text-xs uppercase font-mono tracking-widest text-bento-olive-dark font-bold block">Testimonials</span>
          <h2 className="font-sans text-3xl sm:text-4xl font-black text-bento-text-primary uppercase tracking-tight transition-colors">Loved by Ibadan's Working Class</h2>
          <p className="text-xs sm:text-sm text-bento-text-muted font-medium transition-colors">
            Read stories from local doctors, banking officials, and remote workers who rely on Nouri for stress-free dinners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="reviews-grid">
          {WORK_CLASS_REVIEWS.map((rev) => (
            <div 
              key={rev.id} 
              className="neomorphic-card p-6 space-y-4 flex flex-col justify-between group"
              id={`review-card-${rev.id}`}
            >
              <div className="space-y-3" id="review-main">
                {/* 5 Stars */}
                <div className="flex gap-1 text-bento-tan-dark transition-colors" id="stars-row">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-bento-text-secondary italic leading-relaxed transition-colors" id="review-quote-text">
                  "{rev.quote}"
                </p>
              </div>

              {/* Reviewer Meta */}
              <div className="flex items-center gap-3 border-t border-bento-gray pt-4 mt-2 transition-colors" id="reviewer-meta">
                <img 
                  src={rev.avatar} 
                  alt={rev.name} 
                  className="w-10 h-10 rounded-full object-cover border border-bento-border shrink-0 transition-colors" 
                  referrerPolicy="no-referrer"
                  id="reviewer-avatar"
                />
                <div id="reviewer-text">
                  <h4 className="font-bold text-xs sm:text-sm text-bento-text-primary group-hover:text-bento-olive-dark transition-colors">{rev.name}</h4>
                  <span className="text-[9px] text-bento-text-muted block font-mono uppercase font-bold tracking-tight transition-colors">{rev.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. FAQs SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12" id="faqs">
        {/* Soft elegant top divider */}
        <div className="flex justify-center items-center gap-1.5 pb-4" id="faqs-top-divider">
          <span className="w-1.5 h-1.5 rounded-full bg-bento-olive-dark opacity-30"></span>
          <span className="w-12 h-[1px] bg-bento-border"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-bento-olive-dark opacity-30"></span>
        </div>

        <div className="text-center space-y-3 max-w-2xl mx-auto" id="faqs-heading-block">
          <span className="text-xs uppercase font-mono tracking-widest text-bento-olive-dark font-bold block">Got Questions?</span>
          <h2 className="font-sans text-3xl sm:text-4xl font-black text-bento-text-primary uppercase tracking-tight transition-colors">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-bento-text-muted font-medium transition-colors">
            Learn more about our timing, packaging, and how we cater to busy lifestyles.
          </p>
        </div>

        <div className="space-y-3" id="faqs-list">
          {FAQ_ITEMS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div 
                key={index} 
                className="neomorphic-card overflow-hidden"
                id={`faq-item-${index}`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between font-bold text-sm sm:text-base text-bento-text-primary hover:text-bento-olive-dark transition-colors cursor-pointer"
                  id={`faq-btn-${index}`}
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4.5 h-4.5 text-bento-olive-dark shrink-0 transition-colors" />
                    <span>{faq.question}</span>
                  </span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-bento-text-muted" /> : <ChevronDown className="w-4 h-4 text-bento-text-muted" />}
                </button>
                
                {isOpen && (
                  <div className="px-4 pb-5 pl-11 text-xs sm:text-sm text-bento-text-muted leading-relaxed font-light border-t border-bento-cream pt-3 animate-fadeIn transition-colors" id={`faq-answer-${index}`}>
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. CORE BRAND FOOTER (Matching flyer design elements) */}
      <footer className="bg-bento-cream-dark border-t border-bento-border py-12 px-4 sm:px-6 lg:px-8 text-bento-cream-light transition-colors duration-300" id="footer">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start text-sm" id="footer-grid">
          {/* Logo Brand Statement Column */}
          <div className="md:col-span-5 space-y-4" id="footer-col-brand">
            <div className="flex items-baseline gap-1" id="footer-logo">
              <span className="font-sans text-3xl font-black text-bento-cream-light uppercase tracking-tight">Nouri</span>
              <span className="w-2.5 h-2.5 rounded-full bg-bento-olive transition-colors" id="footer-logo-dot"></span>
            </div>
            <p className="text-xs text-bento-cream-light opacity-80 max-w-sm leading-relaxed font-medium">
              We focus on the working class and busy people who don't have time to enter the kitchen and cook. 
              Fresh swallow, hot rice dinners, premium litre soups & crispy work snacks delivered straight to you.
            </p>
            <div className="text-[10px] text-bento-text-muted font-mono tracking-wider font-bold transition-colors" id="footer-slogan">
              MADE WITH CARE... MADE FOR YOU...
            </div>
          </div>

          {/* Contact Details Column */}
          <div className="md:col-span-4 space-y-3.5" id="footer-col-contact">
            <h4 className="font-sans text-xs uppercase tracking-wider font-bold text-bento-cream-light border-b border-bento-border/30 pb-1.5 transition-colors">To Place Real Orders</h4>
            <div className="space-y-2.5 text-xs text-bento-cream-light opacity-90" id="footer-contacts-list">
              <div className="flex items-center gap-2.5" id="contact-phone">
                <Phone className="w-4 h-4 text-bento-olive-dark" />
                <span>+234-705-462-6118 / +234-703-770-7699</span>
              </div>
              <div className="flex items-center gap-2.5" id="contact-email">
                <Mail className="w-4 h-4 text-bento-olive-dark" />
                <span>nourideyforyou@gmail.com</span>
              </div>
              <div className="flex items-center gap-2.5" id="contact-address">
                <MapPin className="w-4 h-4 text-bento-olive-dark" />
                <span>Ibadan, Oyo State, Nigeria</span>
              </div>
              <div className="flex items-center gap-2.5" id="contact-timing">
                <Clock className="w-4 h-4 text-bento-olive-dark" />
                <span>Delivery starts daily at 4:30 PM</span>
              </div>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-3 space-y-3" id="footer-col-links">
            <h4 className="font-sans text-xs uppercase tracking-wider font-bold text-bento-cream-light border-b border-bento-border/30 pb-1.5 transition-colors">Quick Menu Nav</h4>
            <ul className="space-y-2 text-xs text-bento-cream-light opacity-80 font-medium" id="footer-links-list">
              <li><a href="#menu" className="hover:text-bento-olive-dark transition-colors">Our Complete Menu</a></li>
              <li><a href="#soups" className="hover:text-bento-olive-dark transition-colors">Bulk Soup Bowls (1L - 5L)</a></li>
              <li><a href="#snacks" className="hover:text-bento-olive-dark transition-colors">Snacks & Sizing</a></li>
              <li><a href="#faqs" className="hover:text-bento-olive-dark transition-colors">Frequently Asked Questions</a></li>
              <li><a href="#seo-audit" className="hover:text-bento-olive-dark transition-colors">SEO & Meta Audit</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto border-t border-bento-border/30 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-bento-cream-light opacity-70 gap-4" id="footer-bottom-bar">
          <p id="copyright">© 2026 Nouri Food Delivery Ibadan. All rights reserved.</p>
          <p className="flex items-center gap-1" id="credit">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
            <span>for the hardworking class of Ibadan</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
