import type { APIRoute } from 'astro';
import { getTrackById, getArtistTopTracks, getRelatedArtists, checkSavedTracks } from '../../lib/spotify';
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
  const path = '/api/suggestions';
  const url = new URL(request.url);
  const trackIds = url.searchParams.get('seeds')?.split(',').filter(Boolean);

  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`suggestions:${clientId}`, { windowMs: 60000, maxRequests: 30 });
  if (!rateLimit.allowed) {
    log({ level: 'warn', method: 'GET', path, clientId, error: 'Rate limited' });
    return rateLimitResponse(rateLimit.resetIn);
  }

  if (!trackIds || trackIds.length === 0) {
    return errorResponse('Missing seed track IDs', 400);
  }

  // Validate track IDs format
  const validTrackIdPattern = /^[a-zA-Z0-9]{22}$/;
  if (!trackIds.every(id => validTrackIdPattern.test(id))) {
    return errorResponse('Invalid track ID format', 400);
  }

  // Authentication
  const authResult = await getAuthenticatedToken(request);
  if (!authResult.success) {
    log({ level: 'info', method: 'GET', path, status: 401, duration: Date.now() - startTime });
    return authResult.response;
  }

  const { token, headers } = authResult.data;

  try {
    // Get the seed tracks to find their artists
    const seedTracks = await Promise.all(
      trackIds.slice(0, 2).map((id) => getTrackById(id, token).catch(() => null))
    );

    const validTracks = seedTracks.filter(Boolean);
    if (validTracks.length === 0) {
      return new Response(JSON.stringify({ tracks: [] }), { headers });
    }

    // Collect unique artist IDs from seed tracks
    const artistIds = new Set<string>();
    validTracks.forEach((track) => {
      track!.artists.forEach((artist) => artistIds.add(artist.id));
    });

    // Get top tracks from the first artist and related artists
    const firstArtistId = Array.from(artistIds)[0];

    const [topTracksResponse, relatedArtistsResponse] = await Promise.all([
      getArtistTopTracks(firstArtistId, token),
      getRelatedArtists(firstArtistId, token).catch(() => ({ artists: [] })),
    ]);

    let suggestedTracks = [...topTracksResponse.tracks];

    // Add tracks from a related artist if we have them
    if (relatedArtistsResponse.artists.length > 0) {
      const relatedArtist = relatedArtistsResponse.artists[0];
      try {
        const relatedTracks = await getArtistTopTracks(relatedArtist.id, token);
        suggestedTracks = [...suggestedTracks, ...relatedTracks.tracks];
      } catch {
        // Ignore errors from related artist tracks
      }
    }

    // Remove duplicates and seed tracks
    const seedTrackIds = new Set(trackIds);
    const seenIds = new Set<string>();
    const uniqueTracks = suggestedTracks.filter((track) => {
      if (seedTrackIds.has(track.id) || seenIds.has(track.id)) {
        return false;
      }
      seenIds.add(track.id);
      return true;
    });

    // Limit to 10 tracks
    const finalTracks = uniqueTracks.slice(0, 10);

    // Check which tracks are already liked
    const recTrackIds = finalTracks.map((track) => track.id);
    let likedStatus: boolean[] = [];

    if (recTrackIds.length > 0) {
      likedStatus = await checkSavedTracks(recTrackIds, token);
    }

    // Combine results with liked status
    const tracksWithLiked = finalTracks.map((track, index) => ({
      ...track,
      isLiked: likedStatus[index] || false,
    }));

    log({ level: 'info', method: 'GET', path, status: 200, duration: Date.now() - startTime });
    return new Response(
      JSON.stringify({
        tracks: tracksWithLiked,
      }),
      { headers }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to get suggestions';
    log({ level: 'error', method: 'GET', path, status: 500, duration: Date.now() - startTime, error: errorMessage });
    return errorResponse(errorMessage, 500);
  }
};
