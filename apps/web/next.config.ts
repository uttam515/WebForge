import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@webforge/spec',
    '@webforge/compiler',
    '@webforge/modules',
    '@webforge/questionnaire',
    '@webforge/engine-data',
    '@webforge/engine-api',
    '@webforge/engine-ui',
    '@webforge/engine-admin',
  ],
};

export default nextConfig;
