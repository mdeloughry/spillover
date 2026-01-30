import { getTrackById, getRecommendations, checkSavedTracks } from '../../lib/spotify';
import { withApiHandler, errorResponse } from '../../lib/api-utils';
import { RATE_LIMIT, API_PATHS, VALIDATION, UI } from '../../lib/constants';

export const GET = withApiHandler(
  async ({ context, token, headers, logger }) => {
    const url = new URL(context.request.url);
    const trackIds = url.searchParams.get('seeds')?.split(',').filter(Boolean);

    if (!trackIds || trackIds.length === 0) {
      logger.info(400);
      return errorResponse('Missing seed track IDs', 400);
    }

    // Validate track IDs format
    if (!trackIds.every(id => VALIDATION.SPOTIFY_ID_PATTERN.test(id))) {
      logger.info(400);
      return errorResponse('Invalid track ID format', 400);
    }

    // Get seed tracks to extract artist IDs for better recommendations
    const seedTracks = await Promise.all(
      trackIds.slice(0, 5).map((id) => getTrackById(id, token).catch(() => null))
    );

    const validTracks = seedTracks.filter(Boolean);
    if (validTracks.length === 0) {
      logger.info(200);
      return new Response(JSON.stringify({ tracks: [] }), { headers });
    }

    // Collect unique artist IDs from seed tracks (limit to 2 for diversity)
    const artistIds: string[] = [];
    for (const track of validTracks) {
      if (track && track.artists[0] && !artistIds.includes(track.artists[0].id)) {
        artistIds.push(track.artists[0].id);
        if (artistIds.length >= 2) break;
      }
    }

    // Use Spotify's recommendations API with seed tracks and artists
    // This provides personalized recommendations based on audio features
    const recommendations = await getRecommendations(
      {
        seedTracks: trackIds.slice(0, 3), // Up to 3 seed tracks
        seedArtists: artistIds.slice(0, 2), // Up to 2 seed artists
        limit: UI.MAX_SUGGESTIONS_API,
      },
      token
    );

    // Remove any seed tracks from results
    const seedTrackIds = new Set(trackIds);
    const filteredTracks = recommendations.tracks.filter(
      (track) => !seedTrackIds.has(track.id)
    );

    // Check which tracks are already liked
    const recTrackIds = filteredTracks.map((track) => track.id);
    let likedStatus: boolean[] = [];

    if (recTrackIds.length > 0) {
      likedStatus = await checkSavedTracks(recTrackIds, token);
    }

    // Combine results with liked status
    const tracksWithLiked = filteredTracks.map((track, index) => ({
      ...track,
      isLiked: likedStatus[index] || false,
    }));

    logger.info(200);
    return new Response(
      JSON.stringify({
        tracks: tracksWithLiked,
      }),
      { headers }
    );
  },
  {
    path: API_PATHS.SUGGESTIONS,
    method: 'GET',
    rateLimit: RATE_LIMIT.SUGGESTIONS,
  }
);
