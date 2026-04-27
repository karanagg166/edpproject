/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note: We are using a plain <img> tag for product images in the DetectionPopup
  // because product image URLs from Open Food Facts and UPC Item DB use varying hosts,
  // making wildcard patterns difficult to maintain. By avoiding next/image, 
  // we bypass the need for explicit remotePatterns.
};

module.exports = nextConfig;
