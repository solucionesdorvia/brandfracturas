/** @type {import('next').NextConfig} */
const nextConfig = {
  // No bundlear estas libs nativas/pesadas en el server: se cargan en runtime.
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "puppeteer", "pngjs", "jsqr"],
    // Las facturas reales pesan varios MB; el default de Server Actions es 1MB.
    serverActions: { bodySizeLimit: "30mb" },
  },
};

export default nextConfig;
