/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
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
