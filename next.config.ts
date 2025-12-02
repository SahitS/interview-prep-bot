import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Add empty turbopack config to silence the warning
  turbopack: {},
  
  // Fix CSP issues with OpenAI SDK and development tools
  async headers() {
    // In development, disable CSP restrictions
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Content-Security-Policy',
              // Allow unsafe-eval for development (needed by OpenAI SDK)
              value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
            }
          ]
        }
      ];
    }
    
    // In production, use stricter CSP
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ];
  }
};

export default nextConfig;