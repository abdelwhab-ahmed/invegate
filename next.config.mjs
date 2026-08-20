/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.100.4"],
};

export default nextConfig;