import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SEO Component - Updates page title and meta tags dynamically based on route
 * Includes JSON-LD structured data for search engines
 * Usage: Add <SEO /> component to each page with appropriate props
 */
export default function SEO({ 
  title = "zeuservices",
  description = "GTA Online Account Services. Play Smarter, Not Harder. GTA Online account boosting and progression made simple.",
  keywords = "GTA 5 services, GTA Online, modded accounts, rank boost, gaming services, account boosting",
  image = "https://zeuservices.com/zeus-logo-main.webp",
  type = "website",
  structuredData = null
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

    // Add JSON-LD structured data if provided
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
  }, [title, description, keywords, image, url, type, structuredData]);

  return null;
}

/**
 * Helper function to create Product JSON-LD schema
 */
export function createProductSchema(product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image || "https://zeuservices.com/zeus-logo-main.webp",
    "url": `https://zeuservices.com/boosting/gta5/${product.slug || product.id}`,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "GBP",
      "price": product.price || "0",
      "availability": product.inStock !== false ? "InStock" : "OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "zeuservices"
      }
    },
    "aggregateRating": product.rating ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewCount || "100",
      "bestRating": "5",
      "worstRating": "1"
    } : undefined
  };
}

/**
 * Helper function to create Service JSON-LD schema
 */
export function createServiceSchema(service) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.name,
    "description": service.description,
    "image": service.image || "https://zeuservices.com/zeus-logo-main.webp",
    "url": `https://zeuservices.com/services/${service.slug || service.id}`,
    "provider": {
      "@type": "Organization",
      "name": "zeuservices",
      "url": "https://zeuservices.com",
      "logo": "https://zeuservices.com/zeus-logo-main.webp",
      "sameAs": [
        "http://discord.gg/zeusservices"
      ]
    },
    "areaServed": "Worldwide",
    "availableLanguage": "en"
  };
}

/**
 * Pre-configured SEO settings for common pages
 */
export const SEO_CONFIGS = {
  home: {
    title: "zeuservices - GTA Online Services & Modded Accounts | Play Smarter",
    description: "GTA Online Account Services. Play Smarter, Not Harder. Premium GTA Online account boosting, rank unlocks, and modded accounts. Safe, fast delivery with secure payment. Trusted by thousands of gamers.",
    keywords: "GTA 5 services, GTA Online, modded accounts, rank boost, gaming services, account boosting, zeus services, GTA PC modded account"
  },
  services: {
    title: "GTA Online Services - Account Boosting & Rank Services | zeuservices",
    description: "Professional GTA Online services including rank boosting, vehicle unlocks, progression services, and account enhancement. Safe, secure, and trusted by thousands. Multiple platforms supported: Steam, Epic, Xbox App.",
    keywords: "GTA 5 services, rank boost, vehicle unlocks, GTA modding, gaming services, account boosting, GTA progression, GTA unlock all"
  },
  products: {
    title: "GTA Online Modded Accounts - Premium Products | zeuservices",
    description: "Premium GTA 5 modded accounts for PC. Available for Steam, Epic Games, Xbox App, and Rockstar Launcher. High-rank accounts, unlocked vehicles, instant delivery. Browse our collection of ready-to-play accounts.",
    keywords: "GTA 5 modded accounts, modded GTA account, GTA 5 products, gaming accounts, GTA Online accounts, GTA PC accounts, GTA Steam account"
  },
  reviews: {
    title: "Customer Reviews & Testimonials - See Why Gamers Trust Us | zeuservices",
    description: "Read authentic reviews from satisfied customers. See why zeuservices is trusted by thousands of gamers for GTA 5 Online services. Real feedback, verified purchases, 5-star ratings.",
    keywords: "zeuservices reviews, GTA 5 service reviews, customer testimonials, gaming service reviews, trustpilot, customer feedback"
  },
  cart: {
    title: "Shopping Cart - Review Your Order | zeuservices",
    description: "Review your selected GTA Online services and products. Secure checkout powered by Stripe. Fast processing and instant delivery. Multiple payment methods accepted.",
    keywords: "cart, checkout, shopping cart, secure payment, stripe payment"
  },
  terms: {
    title: "Terms of Service - User Agreement | zeuservices",
    description: "Read our terms of service and understand the rules, policies, and agreements for using zeuservices platform. Clear terms for GTA Online services and products.",
    keywords: "terms of service, user agreement, policies, terms and conditions, service terms"
  },
  privacy: {
    title: "Privacy Policy - How We Protect Your Data | zeuservices",
    description: "Learn how zeuservices protects your privacy and handles your personal information securely. GDPR compliant data protection. Your information is safe with us.",
    keywords: "privacy policy, data protection, user privacy, GDPR compliance, data security"
  },
  refund: {
    title: "Refund & Return Policy - Customer Guarantee | zeuservices",
    description: "Understand our refund and return policy for all GTA Online services and products. Customer satisfaction guaranteed. Clear refund terms and conditions.",
    keywords: "refund policy, returns, money back guarantee, customer protection, satisfaction guarantee"
  },
  orders: {
    title: "My Orders - Track Your Services & Products | zeuservices",
    description: "View and track your GTA Online service orders and purchase history. Check order status, download products, and manage your purchases.",
    keywords: "order history, track orders, my purchases, order status, purchase history"
  },
  settings: {
    title: "Account Settings - Manage Your Profile | zeuservices",
    description: "Manage your zeuservices account settings, update your profile, change password, and configure security preferences. Full control over your account.",
    keywords: "account settings, user profile, account management, profile settings, security"
  }
};
