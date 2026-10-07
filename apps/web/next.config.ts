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
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    };
    return config;
  },
};

export default nextConfig;
