/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/datasets",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
