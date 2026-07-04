/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracing: false,
  experimental: {
    cpus: 1,
    workerThreads: false
  }
};

export default nextConfig;
