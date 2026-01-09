const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Allow backend API and websockets
              "connect-src 'self' http://localhost:4000 ws://localhost:3000 wss://localhost:3000",
              // Allow images and data URIs
              "img-src 'self' data:",
              // Allow styles (Tailwind inline and Google Fonts)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Allow fonts
              "font-src 'self' https://fonts.gstatic.com data:",
              // Allow loading and autoplaying media from same-origin public folder
              "media-src 'self' blob: data: http://localhost:3000 https://localhost:3000",
              // Scripts
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              // Disallow plugins
              "object-src 'none'",
              // Disallow framing
              "frame-ancestors 'none'",
              // Base URI
              "base-uri 'self'",
            ].join("; "),
          },
          // Hint browsers to allow autoplay for video with sound
          {
            key: "Permissions-Policy",
            value: "autoplay=(self), camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;