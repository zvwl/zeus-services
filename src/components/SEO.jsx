import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SEO Component - Updates page title and meta tags dynamically based on route
 * Usage: Add <SEO /> component to each page with appropriate props
 */
export default function SEO({ 
  title = "zeuservices",
  description = "Full-service studio. Unleash the Power of Zeus. Web, mobile, brand, and growth services delivered as fast, tangible outcomes.",
  keywords = "web services, mobile development, brand services, growth services, digital studio",
  image = "https://zeuservices.com/zeus-logo.png",
  type = "website"
}) {
  const location = useLocation();
  const url = `https://zeuservices.com${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
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

    // Update basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);

    // Update Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);

    // Update Twitter Card tags
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', url);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', url);
      document.head.appendChild(canonicalLink);
    }
  }, [title, description, keywords, image, url, type]);

  return null;
}

/**
 * Pre-configured SEO settings for common pages
 */
export const SEO_CONFIGS = {
  home: {
    title: "zeuservices",
    description: "Full-service studio. Unleash the Power of Zeus. Web, mobile, brand, and growth services delivered as fast, tangible outcomes. Get started. About us.",
    keywords: "web services, mobile development, brand services, growth services, digital studio, zeus services"
  },
  services: {
    title: "Zeus Services - GTA Online Account Services",
    description: "GTA Online Account Services. Play Smarter, Not Harder. GTA Online account boosting and progression made simple. Get started. Safe & Easy.",
    keywords: "GTA 5 services, rank boost, vehicle unlocks, GTA modding, gaming services, account boosting"
  },
  products: {
    title: "GTA Online Products | zeuservices",
    description: "Premium GTA 5 modded accounts and products. Browse our selection of high-quality gaming accounts with instant delivery.",
    keywords: "GTA 5 modded accounts, modded GTA account, GTA 5 products, gaming accounts, GTA Online accounts"
  },
  reviews: {
    title: "Customer Reviews | zeuservices",
    description: "Read reviews from satisfied customers. See why zeuservices is trusted by thousands of gamers for GTA 5 Online services.",
    keywords: "zeuservices reviews, GTA 5 service reviews, customer testimonials, gaming service reviews"
  },
  cart: {
    title: "Shopping Cart | zeuservices",
    description: "Review your selected items and proceed to secure checkout. Fast and safe payment processing.",
    keywords: "cart, checkout, shopping cart, secure payment"
  },
  terms: {
    title: "Terms of Service | zeuservices",
    description: "Read our terms of service and understand our policies for using zeuservices platform.",
    keywords: "terms of service, user agreement, policies, terms and conditions"
  },
  privacy: {
    title: "Privacy Policy | zeuservices",
    description: "Learn how zeuservices protects your privacy and handles your personal information securely.",
    keywords: "privacy policy, data protection, user privacy, GDPR compliance"
  },
  refund: {
    title: "Refund Policy | zeuservices",
    description: "Understand our refund and return policy for all services and products purchased on zeuservices.",
    keywords: "refund policy, returns, money back guarantee, customer protection"
  },
  orders: {
    title: "My Orders | zeuservices",
    description: "View and track your service orders and purchase history on zeuservices.",
    keywords: "order history, track orders, my purchases"
  },
  settings: {
    title: "Account Settings | zeuservices",
    description: "Manage your zeuservices account settings, preferences, and security options.",
    keywords: "account settings, user profile, account management"
  }
};
