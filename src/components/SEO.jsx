import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SEO Component - Updates page title and meta tags dynamically based on route
 * Usage: Add <SEO /> component to each page with appropriate props
 */
export default function SEO({ 
  title = "ZeuServices - Premium GTA 5 Online Services",
  description = "Premium GTA 5 Online services, modded accounts, rank boosts, and unlocks. Fast, secure, and reliable delivery.",
  keywords = "GTA 5 services, GTA Online, modded accounts, rank boost",
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
    title: "ZeuServices - Premium GTA 5 Online Services & Modded Accounts",
    description: "Premium GTA 5 Online services, modded accounts, rank boosts, and unlocks. Fast, secure, and reliable delivery. Trusted by thousands of gamers worldwide.",
    keywords: "GTA 5 services, GTA Online, modded accounts, rank boost, GTA 5 unlocks, gaming services"
  },
  services: {
    title: "GTA 5 Services - Rank Boosts & Unlocks | ZeuServices",
    description: "Browse our complete catalog of GTA 5 Online services including rank boosts, vehicle unlocks, and more. Instant delivery and 24/7 support.",
    keywords: "GTA 5 services, rank boost, vehicle unlocks, GTA modding"
  },
  products: {
    title: "GTA 5 Modded Accounts & Products | ZeuServices",
    description: "Premium GTA 5 modded accounts with millions in cash, high ranks, and exclusive unlocks. Safe, secure, and instantly delivered.",
    keywords: "GTA 5 modded accounts, modded GTA account, GTA 5 products, gaming accounts"
  },
  reviews: {
    title: "Customer Reviews & Testimonials | ZeuServices",
    description: "Read reviews from thousands of satisfied customers. See why ZeuServices is the most trusted provider for GTA 5 Online services.",
    keywords: "ZeuServices reviews, GTA 5 service reviews, customer testimonials"
  },
  cart: {
    title: "Shopping Cart | ZeuServices",
    description: "Review your selected GTA 5 services and proceed to secure checkout.",
    keywords: "cart, checkout, GTA 5 services"
  },
  terms: {
    title: "Terms of Service | ZeuServices",
    description: "Read our terms of service and understand our policies for using ZeuServices.",
    keywords: "terms of service, user agreement, policies"
  },
  privacy: {
    title: "Privacy Policy | ZeuServices",
    description: "Learn how ZeuServices protects your privacy and handles your personal information.",
    keywords: "privacy policy, data protection, user privacy"
  },
  refund: {
    title: "Refund Policy | ZeuServices",
    description: "Understand our refund and return policy for all GTA 5 services and products.",
    keywords: "refund policy, returns, money back guarantee"
  },
  orders: {
    title: "My Orders | ZeuServices",
    description: "View and track your GTA 5 service orders.",
    keywords: "order history, track orders"
  },
  settings: {
    title: "Account Settings | ZeuServices",
    description: "Manage your ZeuServices account settings and preferences.",
    keywords: "account settings, user profile"
  }
};
