import type { APIRoute } from 'astro';
import { addToPlaylist } from '../../../lib/spotify';
import {
  getAuthenticatedToken,
  checkRateLimit,
  getClientIdentifier,
  validatePlaylistId,
  validateTrackUri,
  rateLimitResponse,
  errorResponse,
  log,
} from '../../../lib/api-utils';

export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  const path = '/api/playlist/add';

  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`playlist-add:${clientId}`, { windowMs: 60000, maxRequests: 30 });
  if (!rateLimit.allowed) {
    log({ level: 'warn', method: 'POST', path, clientId, error: 'Rate limited' });
    return rateLimitResponse(rateLimit.resetIn);
  }

  // Authentication
  const authResult = await getAuthenticatedToken(request);
  if (!authResult.success) {
    log({ level: 'info', method: 'POST', path, status: 401, duration: Date.now() - startTime });
    return authResult.response;
  }

  const { token, headers } = authResult.data;

  try {
    const body = await request.json();
    const { playlistId, trackUri } = body;

    // Validation
    const playlistValidation = validatePlaylistId(playlistId);
    if (!playlistValidation.valid) {
      log({ level: 'info', method: 'POST', path, status: 400, error: playlistValidation.error });
      return errorResponse(playlistValidation.error!, 400);
    }

    const trackValidation = validateTrackUri(trackUri);
    if (!trackValidation.valid) {
      log({ level: 'info', method: 'POST', path, status: 400, error: trackValidation.error });
      return errorResponse(trackValidation.error!, 400);
    }

    await addToPlaylist(playlistId, trackUri, token);

    log({ level: 'info', method: 'POST', path, status: 200, duration: Date.now() - startTime });
    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to add to playlist';
    log({ level: 'error', method: 'POST', path, status: 500, duration: Date.now() - startTime, error: errorMessage });
    return errorResponse(errorMessage, 500);
  }
};
