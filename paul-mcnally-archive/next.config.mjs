/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: "/exhibition", destination: "/exhibition/index.html" }];
  }
};

export default nextConfig;
