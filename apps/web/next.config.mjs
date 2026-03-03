/** @type {import('next').NextConfig} */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Build a strict Content-Security-Policy.
 * Nonces are added per-request in middleware for inline scripts.
 * 'unsafe-inline' is only used as a fallback for style (Tailwind CSS).
 */
function buildCsp() {
  const apiOrigin = (() => {
    try {
      return new URL(API_BASE).origin;
    } catch {
      return "";
    }
  })();

  const directives = [
    "default-src 'self'",
    `connect-src 'self' ${apiOrigin}`,
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    // Tailwind/Next.js require inline styles; restrict scripts strictly
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  return directives.join("; ");
}

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self)" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: buildCsp() },
        ],
      },
      // Embed routes allow iframing from any origin
      {
        source: "/embed/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
