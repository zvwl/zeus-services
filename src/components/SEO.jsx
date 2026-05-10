'use client'

import { useEffect } from 'react'
export { stripEmojis, HOME_FAQ_SCHEMA } from '@/lib/seo-utils'

export default function SEO({
  title = "Zeuservices - Multi-Game Account Services & Boosting",
  description = "Professional gaming services for your favourite games. Account boosting, modded accounts, and topups for GTA 5, Fortnite, Rocket League, Forza Horizon 6, and more. Safe, fast delivery guaranteed.",
  keywords = "game boosting, account services, topups, modded accounts, gaming services, multi-game platform",
  image = "https://zeuservices.com/zeus-logo-main.webp",
  type = "website",
  robots = "index, follow",
  structuredData = null
}) {
  
  const url = typeof window !== 'undefined' ? `https://zeuservices.com${window.location.pathname}` : 'https://zeuservices.com';

  useEffect(() => {
    document.title = title;

    const updateMetaTag = (name, content, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (element) {
        element.setAttribute('content', content);
      } else {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        element.setAttribute('content', content);
        document.head.appendChild(element);
      }
    };

    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', robots);

    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);

    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', url);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', url);
      document.head.appendChild(canonicalLink);
    }

    if (structuredData) {
      let scriptTag = document.querySelector('script[type="application/ld+json"][data-seo-script="true"]');
      if (scriptTag) {
        scriptTag.textContent = JSON.stringify(structuredData);
      } else {
        scriptTag = document.createElement('script');
        scriptTag.type = 'application/ld+json';
        scriptTag.setAttribute('data-seo-script', 'true');
        scriptTag.textContent = JSON.stringify(structuredData);
        document.head.appendChild(scriptTag);
      }
    }
  }, [title, description, keywords, image, url, type, robots, structuredData]);

  return null;
}

export const SEO_CONFIGS = {
  home: {
    title: "Zeuservices - Multi-Game Topups, Boosting & Accounts",
    description: "Professional gaming services across multiple games. Get account boosting, modded accounts, and topups for GTA 5, Fortnite, Rocket League, Forza Horizon 6, and more. Safe, manual delivery. 9+ years trusted.",
    keywords: "game boosting, account services, topups, modded accounts, gaming services, multi-game platform, GTA 5 services, Fortnite topups, Rocket League boosting"
  },
  services: {
    title: "Boosting Services - Rank Up & Progression | Zeuservices",
    description: "Professional account boosting across all supported games. Rank progression, level grinding, achievement unlocking, and custom progression services. Manual, safe, and reliable.",
    keywords: "account boosting, rank boost, level grinding, progression services, game boosting, achievement unlock, fast ranking"
  },
  products: {
    title: "Modded Accounts & Ready-to-Play Gaming Accounts | Zeuservices",
    description: "Premium pre-built gaming accounts ready to play. Available for GTA 5, Fortnite, Rocket League, Forza Horizon 6, and more. Instant delivery for multiple platforms.",
    keywords: "modded accounts, pre-built accounts, gaming accounts, account products, instant delivery, ready-to-play games"
  },
  reviews: {
    title: "Customer Reviews & Testimonials | Zeuservices",
    description: "Read authentic reviews from thousands of satisfied customers. See why gamers trust Zeuservices for account services across all platforms. Verified feedback, real results.",
    keywords: "customer reviews, gaming service reviews, testimonials, trusted services, customer feedback, verified reviews"
  },
  cart: {
    title: "Shopping Cart - Review Your Order | Zeuservices",
    description: "Review your selected gaming services and products. Secure checkout with Stripe payment. Fast processing and instant delivery on orders.",
    keywords: "shopping cart, checkout, secure payment, gaming cart, order review",
    robots: "noindex, follow"
  },
  terms: {
    title: "Terms of Service | Zeuservices",
    description: "Read our terms of service and user agreement for gaming account boosting and services. Clear terms and policies for all customers.",
    keywords: "terms of service, user agreement, service terms, policies"
  },
  privacy: {
    title: "Privacy Policy - Data Protection & Security | Zeuservices",
    description: "Learn how Zeuservices protects your privacy and personal information. GDPR compliant data protection. Your security is our priority.",
    keywords: "privacy policy, data protection, user privacy, GDPR compliance, data security"
  },
  refund: {
    title: "Refund & Redo Policy | Zeuservices",
    description: "Understand our refund policy. No refunds once service is delivered. If something goes wrong, we redo your order for free. Clear terms on redos, account bans, and your responsibility.",
    keywords: "refund policy, no refunds policy, redo guarantee, service protection, account ban protection"
  },
  orders: {
    title: "My Orders - Track Your Services & Accounts | Zeuservices",
    description: "View and track your gaming service orders and purchase history. Check order status, track delivery, and manage all purchases in one place.",
    keywords: "order history, track orders, my purchases, order status, purchase history, order tracking",
    robots: "noindex, follow"
  },
  settings: {
    title: "Account Settings | Zeuservices",
    description: "Manage your Zeuservices account settings. Update profile, change password, configure security preferences, and control account options.",
    keywords: "account settings, user profile, account management, profile settings, security",
    robots: "noindex, follow"
  }
};
