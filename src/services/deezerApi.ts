import type { Track, CategoryTheme } from '../types/game';

// Clean song title helper to remove clutter like (Remastered...), (Radio Edit...), etc.
export function cleanSongTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/\s*\([0-9]{4}\s+Remaster(ed)?\)/gi, '')
    .replace(/\s*\(Remaster(ed)?(\s+[0-9]{4})?\)/gi, '')
    .replace(/\s*\(Remasterisé(\s+en\s+[0-9]{4})?\)/gi, '')
    .replace(/\s*\[Remaster(ed)?\]/gi, '')
    .replace(/\s*-\s*(Remastered|Radio Edit|Album Version|Single Version).*/gi, '')
    .replace(/\s*\(Radio Edit\)/gi, '')
    .replace(/\s*\(Album Version(\s+Explicit)?\)/gi, '')
    .replace(/\s*\(Single Version\)/gi, '')
    .replace(/\s*\(From ".*?"(\s+Soundtrack)?\)/gi, '')
    .replace(/\s*\(De ".*?"(\s*\/.*?Bande Originale.*?)?\)/gi, '')
    .replace(/\s*\(Extrait de la bande originale.*?\)/gi, '')
    .replace(/\s*\(Live.*?\)/gi, '')
    .trim();
}

// Preset themes with verified Deezer playlist IDs for maximum famous tracks
export const PRESET_THEMES: CategoryTheme[] = [
  {
    id: 'rap-fr',
    name: 'Rap Français',
    description: 'Ninho, Jul, SCH, PNL, Gazo, Damso, Booba, PLK, Kaaris, Niska...',
    icon: '🎙️',
    type: 'playlist',
    deezerId: '5175061384',
    secondaryDeezerId: '9563400362',
    extraDeezerIds: [
      '10013316202',
      '11566938984',
      '1999435002'
    ],
    query: 'Rap Francais Classiques Hits',
    coverUrl: 'https://images.deezer.com/images/cover/ed1a24d528b9fb6c6f7cbb115682245b/250x250.jpg',
    color: 'linear-gradient(135deg, #8e2de2, #4a00e0)'
  },
  {
    id: 'white-girl-music',
    name: 'White Girl Music',
    description: 'Taylor Swift, Katy Perry, Ke$ha, Carly Rae Jepsen, Miley Cyrus, Britney...',
    icon: '💅',
    type: 'playlist',
    deezerId: '12458795303',
    secondaryDeezerId: '12334475271',
    query: 'White Girl Music Hits',
    color: 'linear-gradient(135deg, #ff007f, #ff758c)'
  },
  {
    id: 'rap-us',
    name: 'Rap US',
    description: 'Eminem, 2Pac, The Notorious B.I.G., 50 Cent, Kendrick Lamar, Travis Scott, Drake...',
    icon: '👑',
    type: 'playlist',
    deezerId: '9771682482',
    secondaryDeezerId: '10335983602',
    extraDeezerIds: ['3995638642'],
    query: 'Rap US Classics',
    color: 'linear-gradient(135deg, #f7971e, #ffd200)'
  },
  {
    id: 'annees-2010',
    name: 'Années 2010',
    description: 'Bruno Mars, Rihanna, Drake, Avicii, Macklemore, The Weeknd, Sia, LMFAO...',
    icon: '🕶️',
    type: 'playlist',
    deezerId: '715215865',
    secondaryDeezerId: '14917741483',
    query: '10s Party Hits',
    color: 'linear-gradient(135deg, #00c6ff, #0072ff)'
  },
  {
    id: 'annees-2000',
    name: 'Années 2000',
    description: 'Eminem, 50 Cent, Linkin Park, Black Eyed Peas, Shakira, Usher, Gorillaz...',
    icon: '💿',
    type: 'playlist',
    deezerId: '248297032',
    secondaryDeezerId: '1977689462',
    query: '00s Hits',
    color: 'linear-gradient(135deg, #f857a6, #ff5858)'
  },
  {
    id: 'disney-hits',
    name: 'Disney & Dessins Animés',
    description: 'Le Roi Lion, Aladdin, Reine des Neiges, Mulan, Vaiana, Toy Story...',
    icon: '🏰',
    type: 'playlist',
    deezerId: '613860315',
    secondaryDeezerId: '1032758771',
    extraDeezerIds: ['7548451242', '11817251201'],
    query: 'Disney Les Classiques',
    color: 'linear-gradient(135deg, #a8c0ff, #3f2b96)'
  },
  {
    id: 'cinema-anime',
    name: 'Films & Séries',
    description: 'Star Wars, Harry Potter, Skyfall, Titanic, Dirty Dancing, Grease, 8 Mile...',
    icon: '🎬',
    type: 'playlist',
    deezerId: '12964806423',
    secondaryDeezerId: '18590290',
    query: 'Bandes originales cultes',
    color: 'linear-gradient(135deg, #11998e, #38ef7d)'
  },
  {
    id: 'chanson-francaise',
    name: 'Chanson Française',
    description: 'Goldman, Balavoine, Piaf, Aznavour, Berger, Cabrel, Renaud...',
    icon: '🇫🇷',
    type: 'playlist',
    deezerId: '9608405702',
    secondaryDeezerId: '7346990584',
    extraDeezerIds: ['1420459465', '11462021084'],
    query: 'Les 100 plus belles chansons francaises',
    color: 'linear-gradient(135deg, #3a7bd5, #3a6073)'
  }
];

// Local Vite proxy '/api-deezer'
const DEEZER_API_BASE = '/api-deezer';

const isDev = import.meta.env.DEV;

async function fetchDeezer(endpoint: string): Promise<any> {
  const url = `${DEEZER_API_BASE}${endpoint}`;
  if (isDev) console.log(`📡 [API Deezer] Fetching ${endpoint}`);
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && !data.error) return data;
    }
  } catch (_) {}
  return null;
}

// Search for artists exclusively on Deezer
export async function searchArtists(query: string) {
  if (!query.trim()) return [];
  const data = await fetchDeezer(`/search/artist?q=${encodeURIComponent(query)}&limit=16`);
  if (data && data.data) {
    return data.data.map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      picture: artist.picture_medium || artist.picture_big,
      nb_fans: artist.nb_fan
    }));
  }
  return [];
}

// Search for albums on Deezer
export async function searchAlbums(query: string) {
  if (!query.trim()) return [];
  const data = await fetchDeezer(`/search/album?q=${encodeURIComponent(query)}&limit=16`);
  if (data && data.data) {
    return data.data.map((album: any) => ({
      id: album.id,
      title: cleanSongTitle(album.title),
      artistName: album.artist?.name || 'Artiste Inconnu',
      cover: album.cover_medium || album.cover_big,
      nb_tracks: album.nb_tracks
    }));
  }
  return [];
}

// Fetch tracks for a specific artist strictly from Deezer (loads up to 100 top tracks)
export async function getArtistTracks(artistId: number | string, artistName: string): Promise<Track[]> {
  const data = await fetchDeezer(`/artist/${artistId}/top?limit=100`);
  if (data && data.data) {
    const tracks = filterValidDeezerTracks(data.data, artistName);
    if (tracks.length >= 4) return tracks;
  }

  const searchData = await fetchDeezer(`/search?q=${encodeURIComponent(artistName)}&limit=100`);
  if (searchData && searchData.data) {
    return filterValidDeezerTracks(searchData.data, artistName);
  }

  return [];
}

// Fetch tracks for a specific album strictly from Deezer (loads up to 100 tracks)
export async function getAlbumTracks(albumId: number | string, albumTitle: string, artistName: string, fallbackCoverUrl?: string): Promise<Track[]> {
  const albumDetail = await fetchDeezer(`/album/${albumId}`);
  const albumCoverMedium = albumDetail?.cover_medium || fallbackCoverUrl;
  const albumCoverBig = albumDetail?.cover_big || albumDetail?.cover_xl || albumCoverMedium;

  const data = await fetchDeezer(`/album/${albumId}/tracks?limit=100`);
  if (data && data.data) {
    return data.data
      .filter((t: any) => t && t.preview && (t.title_short || t.title))
      .map((t: any) => ({
        id: t.id,
        title: cleanSongTitle(t.title_short || t.title),
        artist: {
          id: t.artist?.id || '',
          name: t.artist?.name || artistName,
          picture_medium: t.artist?.picture_medium
        },
        album: {
          id: albumId,
          title: cleanSongTitle(albumTitle),
          cover_medium: t.album?.cover_medium || albumCoverMedium,
          cover_big: t.album?.cover_big || t.album?.cover_medium || albumCoverBig
        },
        preview: t.preview,
        duration: t.duration || 30
      }));
  }
  return [];
}

// Fetch tracks for a playlist strictly from Deezer - loads 100-200+ top iconic tracks!
export async function getPlaylistTracks(theme: CategoryTheme): Promise<Track[]> {
  const allRawData: any[] = [];

  if (theme.type === 'chart') {
    const chartData = await fetchDeezer('/chart/0/tracks?limit=100');
    if (chartData && chartData.data) {
      allRawData.push(...chartData.data);
    }
  }

  const playlistIds = [
    theme.deezerId,
    theme.secondaryDeezerId,
    ...(theme.extraDeezerIds || [])
  ].filter(Boolean);

  if (playlistIds.length > 0) {
    const promises = playlistIds.map(async (pid) => {
      const plData = await fetchDeezer(`/playlist/${pid}/tracks?limit=100`);
      if (plData && Array.isArray(plData.data)) return plData.data;
      return [];
    });
    const results = await Promise.all(promises);
    for (const res of results) {
      allRawData.push(...res);
    }
  }

  if (allRawData.length === 0 && theme.query) {
    const searchData = await fetchDeezer(`/search?q=${encodeURIComponent(theme.query)}&limit=100`);
    if (searchData && searchData.data) {
      allRawData.push(...searchData.data);
    }
  }

  return filterValidDeezerTracks(allRawData);
}

// Helper to format Deezer tracks, filter items with preview MP3 URLs, clean titles & sort by popularity rank!
function filterValidDeezerTracks(rawList: any[], defaultArtistName?: string): Track[] {
  if (!Array.isArray(rawList)) return [];

  const seen = new Set<string>();
  const validList: (Track & { rank: number })[] = [];

  for (const t of rawList) {
    if (!t || !t.preview) continue;
    const rawTitle = t.title_short || t.title;
    if (!rawTitle) continue;

    const cleanedTitle = cleanSongTitle(rawTitle);
    const artistName = t.artist?.name || defaultArtistName || 'Artiste Inconnu';

    // Deduplicate by clean artist + title lowercase
    const key = `${artistName.toLowerCase().trim()}___${cleanedTitle.toLowerCase().trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    validList.push({
      id: t.id,
      title: cleanedTitle,
      artist: {
        id: t.artist?.id || '',
        name: artistName,
        picture_medium: t.artist?.picture_medium
      },
      album: {
        id: t.album?.id || '',
        title: cleanSongTitle(t.album?.title || ''),
        cover_medium: t.album?.cover_medium,
        cover_big: t.album?.cover_big || t.album?.cover_medium
      },
      preview: t.preview,
      duration: t.duration || 30,
      rank: typeof t.rank === 'number' ? t.rank : 0
    });
  }

  // Sort by popularity rank descending so the blind test always uses the most well-known, iconic tracks!
  validList.sort((a, b) => b.rank - a.rank);

  // Return the top tracks (up to 250 well-known songs)
  return validList.slice(0, 250).map(({ rank, ...track }) => track);
}

// Fetch general popular tracks on Deezer for extra distractors (100 tracks)
export async function getGeneralDistractorTracks(): Promise<Track[]> {
  const chartData = await fetchDeezer('/chart/0/tracks?limit=100');
  if (chartData && chartData.data) {
    return filterValidDeezerTracks(chartData.data);
  }
  return [];
}
