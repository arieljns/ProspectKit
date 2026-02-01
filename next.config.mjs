/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Skip ESLint during builds (useful for quick deployments)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip TypeScript type checking during builds (useful for quick deployments)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
