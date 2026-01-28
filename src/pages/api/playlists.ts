import type { APIRoute } from 'astro';
import { getPlaylists } from '../../lib/spotify';
import {
  getAuthenticatedToken,
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
  errorResponse,
  log,
} from '../../lib/api-utils';

export const GET: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  const path = '/api/playlists';

  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`playlists:${clientId}`, { windowMs: 60000, maxRequests: 30 });
  if (!rateLimit.allowed) {
    log({ level: 'warn', method: 'GET', path, clientId, error: 'Rate limited' });
    return rateLimitResponse(rateLimit.resetIn);
  }

  // Authentication
  const authResult = await getAuthenticatedToken(request);
  if (!authResult.success) {
    log({ level: 'info', method: 'GET', path, status: 401, duration: Date.now() - startTime });
    return authResult.response;
  }

  const { token, headers } = authResult.data;

  try {
    const playlistsResponse = await getPlaylists(token);

    log({ level: 'info', method: 'GET', path, status: 200, duration: Date.now() - startTime });
    return new Response(
      JSON.stringify({
        playlists: playlistsResponse.items,
        total: playlistsResponse.total,
      }),
      { headers }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to get playlists';
    log({ level: 'error', method: 'GET', path, status: 500, duration: Date.now() - startTime, error: errorMessage });
    return errorResponse(errorMessage, 500);
  }
};
