/** @type {import('next').NextConfig} */
const nextConfig = {
  // No bundlear estas libs nativas/pesadas en el server: se cargan en runtime.
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "puppeteer", "pngjs", "jsqr"],
  },
};

export default nextConfig;
