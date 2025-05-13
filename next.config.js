/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/pathword' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/pathword/' : '',
  images: { unoptimized: true },
  trailingSlash: true,
}

module.exports = nextConfig