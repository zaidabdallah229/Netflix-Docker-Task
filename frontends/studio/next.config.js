/** Vertical-split micro-frontend: the gateway sends every /studio request here. */
module.exports = {
  basePath: '/studio',
  output: 'standalone',
  // `npm run dev` with the stack running in Docker (gateway on :8080)
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [{ source: '/api/:path*', destination: 'http://localhost:8080/api/:path*', basePath: false }]
      : [];
  },
};
