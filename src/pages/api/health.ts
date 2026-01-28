import type { APIRoute } from 'astro';
import { getSecurityHeaders } from '../../lib/api-utils';

// Allowed origins for CORS (extension and same-origin)
const ALLOWED_ORIGINS = [
  'chrome-extension://', // Chrome extensions
  'moz-extension://',    // Firefox extensions
];

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') || '';
  const headers: Record<string, string> = {
    ...getSecurityHeaders(),
    'Content-Type': 'application/json',
  };

  // Allow browser extensions and same-origin requests
  if (ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed)) || !origin) {
    headers['Access-Control-Allow-Origin'] = origin || '*';
    headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }

  return headers;
}

export const GET: APIRoute = async ({ request }) => {
  return new Response(JSON.stringify({
    status: 'ok',
    app: 'spillover',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }), {
    status: 200,
    headers: getCorsHeaders(request),
  });
};

// Handle CORS preflight
export const OPTIONS: APIRoute = async ({ request }) => {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
};
