/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // DiceBear (fallback לאוואטר)
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },

      {
        protocol: 'https',
        hostname: 'pixabay.com',
      },

       {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },

      // Supabase Storage (avatars)
      {
        protocol: 'https',
        hostname: 'dowhdgcvxgzaikmpnchv.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://api.dicebear.com https://pixabay.com https://images.pexels.com https://dowhdgcvxgzaikmpnchv.supabase.co",
              "font-src 'self'",
              "connect-src 'self' https://dowhdgcvxgzaikmpnchv.supabase.co wss://dowhdgcvxgzaikmpnchv.supabase.co https://api-free.deepl.com https://pixabay.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
