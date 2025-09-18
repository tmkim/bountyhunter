import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['tcgplayer-cdn.tcgplayer.com'],
  },
}
export default nextConfig;
