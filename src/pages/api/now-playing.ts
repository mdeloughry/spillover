import type { APIRoute } from 'astro';
import { getCurrentlyPlaying, checkSavedTracks } from '../../lib/spotify';
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
  const path = '/api/now-playing';

  // Rate limiting (allow frequent polling)
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`now-playing:${clientId}`, { windowMs: 60000, maxRequests: 120 });
  if (!rateLimit.allowed) {
    log({ level: 'warn', method: 'GET', path, clientId, error: 'Rate limited' });
    return rateLimitResponse(rateLimit.resetIn);
  }

  // Authentication
  const authResult = await getAuthenticatedToken(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const { token, headers } = authResult.data;

  try {
    const nowPlaying = await getCurrentlyPlaying(token);

    if (!nowPlaying || !nowPlaying.item || nowPlaying.currently_playing_type !== 'track') {
      return new Response(JSON.stringify({ playing: false }), { status: 200, headers });
    }

    // Check if track is liked
    const [isLiked] = await checkSavedTracks([nowPlaying.item.id], token);

    return new Response(JSON.stringify({
      playing: true,
      is_playing: nowPlaying.is_playing,
      progress_ms: nowPlaying.progress_ms,
      track: {
        ...nowPlaying.item,
        isLiked,
      },
    }), { status: 200, headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch now playing';
    log({ level: 'error', method: 'GET', path, status: 500, duration: Date.now() - startTime, error: errorMessage });
    return errorResponse(errorMessage, 500);
  }
};
