/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We don't ship an ESLint config in this repo; type-checking still runs.
  eslint: { ignoreDuringBuilds: true },
  // Keep server actions / routes unbuffered so streaming AI responses work.
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  async headers() {
    return [];
  },
};

export default nextConfig;
