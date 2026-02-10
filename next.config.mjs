/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Skip TypeScript type checking during builds (useful for quick deployments)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
