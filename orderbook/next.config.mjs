/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Export a fully static site; ideal for Netlify without SSR/runtime
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
