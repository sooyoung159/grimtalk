/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/kanana': [
        './node_modules/ffmpeg-static/**/*',
      ],
    },
  },
};

export default nextConfig;
