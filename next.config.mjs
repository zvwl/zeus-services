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
}

export default nextConfig
