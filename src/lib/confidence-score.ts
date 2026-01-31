/**
 * Confidence scoring for imported track matches
 * Calculates how well a Spotify track matches the original query
 */

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ConfidenceScore {
  /** Numeric score from 0-100 */
  score: number;
  /** Categorical confidence level */
  level: ConfidenceLevel;
  /** Title similarity score (0-100) */
  titleScore: number;
  /** Artist similarity score (0-100) */
  artistScore: number;
}

/** Scoring weights */
const TITLE_WEIGHT = 0.6;
const ARTIST_WEIGHT = 0.4;

/** Confidence thresholds */
const HIGH_THRESHOLD = 80;
const MEDIUM_THRESHOLD = 50;

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Normalize a string for comparison
 * - Lowercase
 * - Remove punctuation
 * - Normalize whitespace
 * - Remove common suffixes like "(Official Video)", "[HD]", etc.
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    // Remove common video/audio suffixes
    .replace(/\s*[\(\[]?(official\s*)?(music\s*)?(video|audio|lyrics?|visualizer|hd|4k|remaster(ed)?|remix|live|acoustic|version)[\)\]]?\s*/gi, ' ')
    // Remove "(feat. X)" or "[ft. X]" variations
    .replace(/\s*[\(\[](feat\.?|ft\.?|featuring)\s*[^\)\]]+[\)\]]/gi, '')
    // Remove punctuation except spaces
    .replace(/[^\w\s]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate string similarity as a percentage (0-100)
 */
export function stringSimilarity(a: string, b: string): number {
  const normalizedA = normalizeString(a);
  const normalizedB = normalizeString(b);

  if (normalizedA === normalizedB) {
    return 100;
  }

  if (normalizedA.length === 0 || normalizedB.length === 0) {
    return 0;
  }

  const distance = levenshteinDistance(normalizedA, normalizedB);
  const maxLength = Math.max(normalizedA.length, normalizedB.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.round(Math.max(0, similarity));
}

/**
 * Compare titles with special handling for common variations
 */
export function compareTitles(queryTitle: string, spotifyTitle: string): number {
  // Direct comparison after normalization
  const similarity = stringSimilarity(queryTitle, spotifyTitle);

  // Bonus: Check if one contains the other (common for remixes, edits)
  const normalizedQuery = normalizeString(queryTitle);
  const normalizedSpotify = normalizeString(spotifyTitle);

  if (normalizedQuery.includes(normalizedSpotify) || normalizedSpotify.includes(normalizedQuery)) {
    return Math.max(similarity, 85);
  }

  return similarity;
}

/**
 * Compare artists - matches against any artist in the array
 */
export function compareArtists(
  queryArtist: string | undefined,
  spotifyArtists: Array<{ name: string }>
): number {
  if (!queryArtist || spotifyArtists.length === 0) {
    // No artist info available - neutral score
    return 50;
  }

  const normalizedQuery = normalizeString(queryArtist);

  // Find the best match among all artists
  let bestMatch = 0;
  for (const artist of spotifyArtists) {
    const similarity = stringSimilarity(queryArtist, artist.name);
    bestMatch = Math.max(bestMatch, similarity);

    // Also check if query contains artist name or vice versa
    const normalizedArtist = normalizeString(artist.name);
    if (normalizedQuery.includes(normalizedArtist) || normalizedArtist.includes(normalizedQuery)) {
      bestMatch = Math.max(bestMatch, 80);
    }
  }

  return bestMatch;
}

/**
 * Determine confidence level from score
 */
export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= HIGH_THRESHOLD) {
    return 'high';
  }
  if (score >= MEDIUM_THRESHOLD) {
    return 'medium';
  }
  return 'low';
}

/**
 * Calculate overall confidence score for a track match
 * @param originalTitle - The original track title from the source
 * @param originalArtist - The original artist name (optional)
 * @param spotifyTrack - The matched Spotify track
 */
export function calculateConfidence(
  originalTitle: string,
  originalArtist: string | undefined,
  spotifyTrack: { name: string; artists: Array<{ name: string }> }
): ConfidenceScore {
  const titleScore = compareTitles(originalTitle, spotifyTrack.name);
  const artistScore = compareArtists(originalArtist, spotifyTrack.artists);

  // Weighted average
  const score = Math.round(titleScore * TITLE_WEIGHT + artistScore * ARTIST_WEIGHT);
  const level = getConfidenceLevel(score);

  return {
    score,
    level,
    titleScore,
    artistScore,
  };
}
