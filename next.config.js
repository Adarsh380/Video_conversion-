const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist', '@napi-rs/canvas'],
  },
  async rewrites() {
    return [{ source: '/api/:path*', destination: 'http://localhost:3002/api/:path*' }];
  },
  webpack(config) {
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@remotion\/compositor-/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/lib-cov\/fluent-ffmpeg$/,
      })
    );
    return config;
  },
};

module.exports = nextConfig;

