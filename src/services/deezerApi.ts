import type { Track, CategoryTheme } from '../types/game';

// Preset themes with verified Deezer playlist IDs
export const PRESET_THEMES: CategoryTheme[] = [
  {
    id: 'top-france',
    name: 'Top 50 France',
    description: 'Les plus grands hits du moment en France',
    icon: '🔥',
    type: 'chart',
    deezerId: '3155776842',
    query: 'French Hits 2024',
    coverUrl: 'https://images.deezer.com/images/cover/0e9a59b2dcd682705786ba1fa57353f4/250x250.jpg',
    color: 'linear-gradient(135deg, #ff416c, #ff4b2b)'
  },
  {
    id: 'rap-fr',
    name: 'Rap Français',
    description: 'Jul, Ninho, PNL, SCH, Gazo, Damso, Booba...',
    icon: '🎙️',
    type: 'playlist',
    deezerId: '6156189524',
    query: 'Rap Francais',
    coverUrl: 'https://images.deezer.com/images/cover/ed1a24d528b9fb6c6f7cbb115682245b/250x250.jpg',
    color: 'linear-gradient(135deg, #8e2de2, #4a00e0)'
  },
  {
    id: 'pop-80s-90s',
    name: 'Années 80 & 90',
    description: 'Les classiques indémodables et hits rétro',
    icon: '📼',
    type: 'playlist',
    deezerId: '1116190041',
    query: 'Les annees 80 90',
    coverUrl: 'https://images.deezer.com/images/cover/84ff358eaae626bd3ea671e21b0fbba7/250x250.jpg',
    color: 'linear-gradient(135deg, #f80759, #bc4e9c)'
  },
  {
    id: 'cinema-anime',
    name: 'Films & Animes',
    description: 'Bandes originales de films, séries et animes',
    icon: '🎬',
    type: 'playlist',
    deezerId: '1970220262',
    query: 'Bande originale de film',
    color: 'linear-gradient(135deg, #11998e, #38ef7d)'
  },
  {
    id: 'electro-dance',
    name: 'Electro & Dance',
    description: 'Daft Punk, David Guetta, Avicii, Calvin Harris...',
    icon: '⚡',
    type: 'playlist',
    deezerId: '1410189005',
    query: 'Electro Dance Hits',
    color: 'linear-gradient(135deg, #00c6ff, #0072ff)'
  },
  {
    id: 'rock-classics',
    name: 'Rock & Metal',
    description: 'Queen, AC/DC, Nirvana, Metallica, Muse...',
    icon: '🎸',
    type: 'playlist',
    deezerId: '1282483245',
    query: 'Rock Classics',
    color: 'linear-gradient(135deg, #f12711, #f5af19)'
  },
  {
    id: 'disney-hits',
    name: 'Disney & Dessins Animés',
    description: 'Les chansons mythiques de l\'enfance',
    icon: '🏰',
    type: 'playlist',
    deezerId: '1264969245',
    query: 'Disney Hits',
    color: 'linear-gradient(135deg, #a8c0ff, #3f2b96)'
  },
  {
    id: 'chanson-francaise',
    name: 'Chanson Française',
    description: 'Goldman, Balavoine, Piaf, Aznavour, Stromae...',
    icon: '🇫🇷',
    type: 'playlist',
    deezerId: '1116174141',
    query: 'Les plus belles chansons francaises',
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
  const data = await fetchDeezer(`/search/artist?q=${encodeURIComponent(query)}&limit=12`);
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

// Fetch tracks for a specific artist strictly from Deezer
export async function getArtistTracks(artistId: number | string, artistName: string): Promise<Track[]> {
  const data = await fetchDeezer(`/artist/${artistId}/top?limit=50`);
  if (data && data.data) {
    const tracks = filterValidDeezerTracks(data.data, artistName);
    if (tracks.length >= 4) return tracks;
  }

  const searchData = await fetchDeezer(`/search?q=${encodeURIComponent(artistName)}&limit=50`);
  if (searchData && searchData.data) {
    return filterValidDeezerTracks(searchData.data, artistName);
  }

  return [];
}

// Fetch tracks for a playlist strictly from Deezer
export async function getPlaylistTracks(theme: CategoryTheme): Promise<Track[]> {
  let rawData: any[] = [];

  if (theme.type === 'chart') {
    const chartData = await fetchDeezer('/chart/0/tracks?limit=50');
    if (chartData && chartData.data) rawData = chartData.data;
  }

  if (rawData.length === 0 && theme.deezerId) {
    const playlistData = await fetchDeezer(`/playlist/${theme.deezerId}/tracks?limit=50`);
    if (playlistData && playlistData.data) rawData = playlistData.data;
  }

  if (rawData.length === 0 && theme.query) {
    const searchData = await fetchDeezer(`/search?q=${encodeURIComponent(theme.query)}&limit=50`);
    if (searchData && searchData.data) rawData = searchData.data;
  }

  return filterValidDeezerTracks(rawData);
}

// Helper to format Deezer tracks & filter items with preview MP3 URLs
function filterValidDeezerTracks(rawList: any[], defaultArtistName?: string): Track[] {
  if (!Array.isArray(rawList)) return [];

  return rawList
    .filter((t: any) => t && t.preview && (t.title_short || t.title))
    .map((t: any) => ({
      id: t.id,
      title: t.title_short || t.title,
      artist: {
        id: t.artist?.id || '',
        name: t.artist?.name || defaultArtistName || 'Artiste Inconnu',
        picture_medium: t.artist?.picture_medium
      },
      album: {
        id: t.album?.id || '',
        title: t.album?.title || '',
        cover_medium: t.album?.cover_medium,
        cover_big: t.album?.cover_big || t.album?.cover_medium
      },
      preview: t.preview,
      duration: t.duration || 30
    }));
}

// Fetch general popular tracks on Deezer for extra distractors if needed
export async function getGeneralDistractorTracks(): Promise<Track[]> {
  const chartData = await fetchDeezer('/chart/0/tracks?limit=50');
  if (chartData && chartData.data) {
    return filterValidDeezerTracks(chartData.data);
  }
  return [];
}
