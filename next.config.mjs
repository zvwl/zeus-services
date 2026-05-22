/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xdvbhungoadwlmeddelt.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'cdn.buymeacoffee.com',
      },
    ],
  },
  async redirects() {
    return [
      // Old Vite-era routes that no longer exist
      { source: '/products', destination: '/topups', permanent: true },
      { source: '/services', destination: '/boosting', permanent: true },

      // Emoji slug → canonical slug (Google indexed the emoji variant)
      {
        source: '/accounts/gta5/%E2%9A%A1-full-account',
        destination: '/accounts/gta5/full-account',
        permanent: true,
      },

      // Game exists but has no items in this category → parent category
      {
        source: '/boosting/forza-horizon-6',
        destination: '/boosting',
        permanent: false,
      },

      // Item slug "fortnite" never existed → game's category listing
      {
        source: '/topups/fortnite/fortnite',
        destination: '/topups/fortnite',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
