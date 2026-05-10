export const stripEmojis = (str) =>
  str ? str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim() : str

export const HOME_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Why buy from Zeuservices?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'With 9+ years of experience, we craft every order carefully and handle your account with the utmost care. All services are delivered manually through Discord so you always have a full communication history.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I buy from Zeuservices?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Browse our games and services, select your version and platform, add to cart, and checkout securely via Stripe. Once payment is confirmed, we contact you via Discord for delivery.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is it safe to buy from Zeuservices?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We have been operating for 9+ years with thousands of successful orders. All payments are secured via Stripe. Services are completed manually by experienced staff with game-specific safety practices.',
      },
    },
    {
      '@type': 'Question',
      name: 'How fast is delivery?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most orders are delivered within 20 minutes to 5 hours. After purchase you will be contacted via Discord with instructions and progress updates throughout the process.',
      },
    },
    {
      '@type': 'Question',
      name: 'What payment methods do you accept?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We accept all major credit/debit cards via Stripe. All transactions are secured and encrypted. We never store your payment details.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which games do you support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We currently support GTA 5, Fortnite, Rocket League, Forza Horizon 6, and more. Visit our services pages to browse all available games and service types.',
      },
    },
  ],
}
