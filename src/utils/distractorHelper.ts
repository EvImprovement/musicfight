import type { Track } from '../types/game';

/**
 * Normalizes a string for robust deduplication and comparison.
 */
function normalize(str: string): string {
  return (str || '').toLowerCase().trim();
}

/**
 * Smartly picks 3 distractors for a blind-test question.
 *
 * Rules:
 * 1. Never pick the current track (by id or normalized title).
 * 2. Never return duplicate titles among distractors.
 * 3. In multi-artist or multi-album duels:
 *    - Always include 1 or 2 distractors from the current track's artist.
 *    - Include 1 or 2 distractors from the other participating artist(s)/album(s).
 *    -> This ensures the 4 choices on screen always present multiple options for the
 *       currently playing artist, preventing players from cheating simply by recognizing
 *       the artist's voice/name without knowing the song title!
 * 4. In single-artist or single-album modes:
 *    - All distractors come from that same artist/album.
 */
export function pickSmartDistractors(currentTrack: Track, candidatePool: Track[]): Track[] {
  if (!currentTrack || !Array.isArray(candidatePool)) {
    return [];
  }

  const currentTitle = normalize(currentTrack.title);
  const currentArtist = normalize(currentTrack.artist?.name || '');

  // Filter out current track by id or identical title
  const validCandidates = candidatePool.filter(t => {
    if (!t || !t.id || !t.title) return false;
    if (String(t.id) === String(currentTrack.id)) return false;
    if (normalize(t.title) === currentTitle) return false;
    return true;
  });

  // Deduplicate candidates by normalized title to prevent identical options
  const uniqueTitleMap = new Map<string, Track>();
  for (const t of validCandidates) {
    const key = normalize(t.title);
    if (!uniqueTitleMap.has(key)) {
      uniqueTitleMap.set(key, t);
    }
  }
  const uniquePool = Array.from(uniqueTitleMap.values());

  if (uniquePool.length <= 3) {
    return uniquePool;
  }

  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  // Partition candidates by artist matching currentTrack
  const sameArtistCandidates = uniquePool.filter(
    t => normalize(t.artist?.name || '') === currentArtist
  );
  const diffArtistCandidates = uniquePool.filter(
    t => normalize(t.artist?.name || '') !== currentArtist
  );

  // When both same artist tracks and rival artist tracks exist (Multi-Artist or Multi-Album battle)
  if (sameArtistCandidates.length > 0 && diffArtistCandidates.length > 0) {
    const shuffledSame = shuffle(sameArtistCandidates);
    const shuffledDiff = shuffle(diffArtistCandidates);

    // Pick 1 or 2 from same artist (so screen has 2 or 3 of current artist total)
    const targetSame = Math.min(shuffledSame.length, Math.random() < 0.5 ? 2 : 1);
    const targetDiff = 3 - targetSame;

    const pickedSame = shuffledSame.slice(0, targetSame);
    const pickedDiff = shuffledDiff.slice(0, targetDiff);

    const combined = [...pickedSame, ...pickedDiff];

    // If diff didn't have enough to fill 3, fill from remaining same
    if (combined.length < 3) {
      const remainingSame = shuffledSame.slice(targetSame);
      combined.push(...remainingSame.slice(0, 3 - combined.length));
    }
    // If same didn't have enough to fill 3, fill from remaining diff
    if (combined.length < 3) {
      const remainingDiff = shuffledDiff.slice(targetDiff);
      combined.push(...remainingDiff.slice(0, 3 - combined.length));
    }

    return shuffle(combined).slice(0, 3);
  }

  // Single artist mode or fallback: pick 3 random unique candidates
  return shuffle(uniquePool).slice(0, 3);
}
