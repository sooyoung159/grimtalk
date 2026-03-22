/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/*': [
      './node_modules/ffmpeg-static/**/*',
    ],
  },
};

export default nextConfig;
