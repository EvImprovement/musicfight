import React, { useState, useEffect } from 'react';
import { Users, Crown, Copy, Check, Share2, Play, LogOut, Loader2, Music2, ShieldAlert, Disc3, Search, Mic2 } from 'lucide-react';
import type { RoomPlayer, RoomSettings, CategoryTheme, Track, Option } from '../types/game';
import { PRESET_THEMES, getPlaylistTracks, searchAlbums, getAlbumTracks, searchArtists, getArtistTracks } from '../services/deezerApi';
import type { MultiplayerRoomManager } from '../services/multiplayerRoom';

interface PresetAlbum {
  id: number;
  title: string;
  artistName: string;
  cover: string;
}

const POPULAR_ALBUMS: PresetAlbum[] = [
  { id: 116180752, title: 'Deux Frères', artistName: 'PNL', cover: 'https://cdn-images.dzcdn.net/images/cover/6e14fef7ed2c5684a36badd00b693036/250x250-000000-80-0-0.jpg' },
  { id: 91095382, title: 'Destin', artistName: 'Ninho', cover: 'https://cdn-images.dzcdn.net/images/cover/ac0ec199892ba83b2f8969a592530a79/250x250-000000-80-0-0.jpg' },
  { id: 302127, title: 'Discovery', artistName: 'Daft Punk', cover: 'https://cdn-images.dzcdn.net/images/cover/5718f7c81c27e0b2417e2a4c45224f8a/250x250-000000-80-0-0.jpg' },
  { id: 96126, title: 'Thriller', artistName: 'Michael Jackson', cover: 'https://cdn-images.dzcdn.net/images/cover/f01e09ceb8ad1e96707c1b4aadb5911b/250x250-000000-80-0-0.jpg' },
  { id: 40687031, title: 'Ipséité', artistName: 'Damso', cover: 'https://cdn-images.dzcdn.net/images/cover/79ba3cd515942d1dc62f49f859a374fd/250x250-000000-80-0-0.jpg' },
  { id: 270762122, title: 'Civilisation', artistName: 'Orelsan', cover: 'https://cdn-images.dzcdn.net/images/cover/974e863966461c44768f0732752695c9/250x250-000000-80-0-0.jpg' },
  { id: 137272602, title: 'After Hours', artistName: 'The Weeknd', cover: 'https://cdn-images.dzcdn.net/images/cover/f520bf0be2e3cfc476824e75d20a164a/250x250-000000-80-0-0.jpg' },
  { id: 14720858, title: 'Cyborg', artistName: 'Nekfeu', cover: 'https://cdn-images.dzcdn.net/images/cover/bac0ea75cfad929e85de82ee823cd638/250x250-000000-80-0-0.jpg' }
];

interface PresetArtist {
  id: number;
  name: string;
  picture: string;
  genre: string;
}

const POPULAR_ARTISTS: PresetArtist[] = [
  { id: 1191615, name: 'Jul', picture: 'https://cdn-images.dzcdn.net/images/artist/16eb681d72934d4db17088dfc216669d/250x250-000000-80-0-0.jpg', genre: 'Rap FR' },
  { id: 5542343, name: 'Ninho', picture: 'https://cdn-images.dzcdn.net/images/artist/7601c5c0e2bd16cb585898316fd0dfec/250x250-000000-80-0-0.jpg', genre: 'Rap FR' },
  { id: 1519461, name: 'PNL', picture: 'https://cdn-images.dzcdn.net/images/artist/9277fdce45b79945918c24f69cb6e8e3/250x250-000000-80-0-0.jpg', genre: 'Rap FR' },
  { id: 9197980, name: 'Damso', picture: 'https://cdn-images.dzcdn.net/images/artist/f1a596b126611260994271ce4cb54bb0/250x250-000000-80-0-0.jpg', genre: 'Rap FR' },
  { id: 259467, name: 'Orelsan', picture: 'https://cdn-images.dzcdn.net/images/artist/cb21b6617783e6050240ba76ca9b3034/250x250-000000-80-0-0.jpg', genre: 'Rap FR' },
  { id: 1479842, name: 'PLK', picture: 'https://cdn-images.dzcdn.net/images/artist/f57f9dca944e55afdd99802491c49823/250x250-000000-80-0-0.jpg', genre: 'Rap FR' },
  { id: 8873540, name: 'Gazo', picture: 'https://cdn-images.dzcdn.net/images/artist/54c1dc208f92240e9d56b595708ed284/250x250-000000-80-0-0.jpg', genre: 'Rap FR' },
  { id: 1412564, name: 'Nekfeu', picture: 'https://cdn-images.dzcdn.net/images/artist/0c093e137a288db8d08133ecf092c213/250x250-000000-80-0-0.jpg', genre: 'Rap FR' },
  { id: 162665, name: 'SCH', picture: 'https://cdn-images.dzcdn.net/images/artist/8d9c407bd25fab0fc961b6abf335e874/250x250-000000-80-0-0.jpg', genre: 'Rap FR' },
  { id: 390, name: 'Booba', picture: 'https://cdn-images.dzcdn.net/images/artist/38b687e97c6874e744d305ef2ca8d0d0/250x250-000000-80-0-0.jpg', genre: 'Rap FR' },
  { id: 4050205, name: 'The Weeknd', picture: 'https://cdn-images.dzcdn.net/images/artist/581693b4724a7fcfa754455101e13a44/250x250-000000-80-0-0.jpg', genre: 'Pop / R&B' },
  { id: 246791, name: 'Drake', picture: 'https://cdn-images.dzcdn.net/images/artist/eb0ed5b21d1ea5af021fc074ded0e91f/250x250-000000-80-0-0.jpg', genre: 'Rap US' },
  { id: 13, name: 'Eminem', picture: 'https://cdn-images.dzcdn.net/images/artist/0f30bbd33a680030054af004d698d6ac/250x250-000000-80-0-0.jpg', genre: 'Rap US' },
  { id: 4495513, name: 'Travis Scott', picture: 'https://cdn-images.dzcdn.net/images/artist/8d8316146026d7e6ce377e314536df62/250x250-000000-80-0-0.jpg', genre: 'Rap US' },
  { id: 27, name: 'Daft Punk', picture: 'https://cdn-images.dzcdn.net/images/artist/638e69b9caaf9f9f3f8826febea7b543/250x250-000000-80-0-0.jpg', genre: 'Electro' },
  { id: 12246, name: 'Taylor Swift', picture: 'https://cdn-images.dzcdn.net/images/artist/cc2495870fe1a792ad0cdb05501ad5ec/250x250-000000-80-0-0.jpg', genre: 'Pop' },
  { id: 564, name: 'Rihanna', picture: 'https://cdn-images.dzcdn.net/images/artist/b78cdc205fae2641b89208e78b30e1b3/250x250-000000-80-0-0.jpg', genre: 'Pop / R&B' },
  { id: 259, name: 'Michael Jackson', picture: 'https://cdn-images.dzcdn.net/images/artist/97fae13b2b30e4aec2e8c9e0c7839d92/250x250-000000-80-0-0.jpg', genre: 'Pop' }
];

interface MultiplayerLobbyProps {
  manager: MultiplayerRoomManager;
  players: RoomPlayer[];
  initialSettings?: RoomSettings;
  onStartGame: (
    settings: RoomSettings,
    tracks: Track[],
    distractorPool: Track[],
    initialQuestion?: {
      questionIndex: number;
      startTime: number;
      correctOptionId: string | number;
      correctOption: Option;
      options: Option[];
    }
  ) => void;
  onLeaveRoom: () => void;
}

const DEFAULT_SETTINGS: RoomSettings = {
  themeId: '',
  themeName: '',
  themeIcon: '🎵',
  themeColor: 'linear-gradient(135deg, #8e2de2, #4a00e0)',
  themeType: 'playlist',
  themeIds: [],
  trackCount: 10,
  timePerTrack: 10,
  gameplayMode: 'buzzer',
  albums: [],
  artists: []
};

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  manager,
  players,
  initialSettings,
  onStartGame,
  onLeaveRoom
}) => {
  const [settings, setSettings] = useState<RoomSettings>(() => initialSettings || DEFAULT_SETTINGS);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const [themeTab, setThemeTab] = useState<'presets' | 'artists' | 'albums'>(() => {
    if (initialSettings?.themeType === 'artist' || initialSettings?.themeId.startsWith('artist-')) {
      return 'artists';
    }
    if (initialSettings?.themeType === 'album' || initialSettings?.themeId.startsWith('album-')) {
      return 'albums';
    }
    return 'presets';
  });

  const [albumQuery, setAlbumQuery] = useState('');
  const [albumResults, setAlbumResults] = useState<any[]>([]);
  const [isSearchingAlbums, setIsSearchingAlbums] = useState(false);

  const [artistQuery, setArtistQuery] = useState('');
  const [artistResults, setArtistResults] = useState<any[]>([]);
  const [isSearchingArtists, setIsSearchingArtists] = useState(false);

  const isHost = manager.isHost || !!players.find(p => p.id === manager.myPlayerId)?.isHost;

  // Sync settings when initialSettings changes or on broadcast
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
      if (initialSettings.themeType === 'artist' || initialSettings.themeId.startsWith('artist-')) {
        setThemeTab('artists');
      } else if (initialSettings.themeType === 'album' || initialSettings.themeId.startsWith('album-')) {
        setThemeTab('albums');
      } else {
        setThemeTab('presets');
      }
    }
  }, [initialSettings]);

  useEffect(() => {
    const unsub = manager.subscribeEvents((event) => {
      if (event.type === 'SETTINGS_UPDATE') {
        setSettings(event.settings);
        if (event.settings.themeType === 'artist' || event.settings.themeId.startsWith('artist-')) {
          setThemeTab('artists');
        } else if (event.settings.themeType === 'album' || event.settings.themeId.startsWith('album-')) {
          setThemeTab('albums');
        } else {
          setThemeTab('presets');
        }
      }
    });
    return unsub;
  }, [manager]);

  // Synchronize settings to newly joined players
  useEffect(() => {
    if (isHost && players.length > 1 && (settings.themeName || (settings.themeIds && settings.themeIds.length > 0) || (settings.albums && settings.albums.length > 0) || (settings.artists && settings.artists.length > 0))) {
      manager.sendEvent({
        type: 'SETTINGS_UPDATE',
        settings
      });
    }
  }, [players.length, isHost]);

  // Debounced search for albums
  useEffect(() => {
    if (!albumQuery.trim() || themeTab !== 'albums') {
      setAlbumResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingAlbums(true);
      try {
        const res = await searchAlbums(albumQuery);
        setAlbumResults(res);
      } catch (_) {
        setAlbumResults([]);
      } finally {
        setIsSearchingAlbums(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [albumQuery, themeTab]);

  // Debounced search for artists
  useEffect(() => {
    if (!artistQuery.trim() || themeTab !== 'artists') {
      setArtistResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingArtists(true);
      try {
        const res = await searchArtists(artistQuery);
        setArtistResults(res);
      } catch (_) {
        setArtistResults([]);
      } finally {
        setIsSearchingArtists(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [artistQuery, themeTab]);

  // Synchronize settings changes if host updates them
  const updateSetting = <K extends keyof RoomSettings>(key: K, value: RoomSettings[K]) => {
    if (!isHost) return;
    setStartError(null);
    const next = { ...settings, [key]: value };
    setSettings(next);
    manager.sendEvent({
      type: 'SETTINGS_UPDATE',
      settings: next
    });
  };

  const switchToPresets = () => {
    if (!isHost) return;
    setThemeTab('presets');
    setStartError(null);

    // Clean reset so no previous album or artist selections linger
    const next: RoomSettings = {
      ...settings,
      themeId: '',
      themeIds: [],
      themeType: 'playlist',
      themeName: '',
      themeIcon: '🎵',
      themeColor: 'linear-gradient(135deg, #8e2de2, #4a00e0)',
      albumId: undefined,
      albumArtist: undefined,
      albumCover: undefined,
      albums: [],
      artists: []
    };
    setSettings(next);
    manager.sendEvent({
      type: 'SETTINGS_UPDATE',
      settings: next
    });
  };

  const switchToArtists = () => {
    if (!isHost) return;
    setThemeTab('artists');
    setStartError(null);

    // Clean reset with NOTHING selected by default
    const next: RoomSettings = {
      ...settings,
      themeId: 'artist-none',
      themeIds: [],
      themeType: 'artist',
      themeName: '',
      themeIcon: '🎤',
      themeColor: 'linear-gradient(135deg, #f093fb, #f5576c)',
      albumId: undefined,
      albumArtist: undefined,
      albumCover: undefined,
      albums: [],
      artists: []
    };
    setSettings(next);
    manager.sendEvent({
      type: 'SETTINGS_UPDATE',
      settings: next
    });
  };

  const switchToAlbums = () => {
    if (!isHost) return;
    setThemeTab('albums');
    setStartError(null);

    // Clean reset with NOTHING selected by default (no auto-selection)
    const next: RoomSettings = {
      ...settings,
      themeId: 'album-none',
      themeIds: [],
      themeType: 'album',
      themeName: '',
      themeIcon: '💿',
      themeColor: 'linear-gradient(135deg, #11998e, #38ef7d)',
      albumId: undefined,
      albumArtist: undefined,
      albumCover: undefined,
      albums: [],
      artists: []
    };
    setSettings(next);
    manager.sendEvent({
      type: 'SETTINGS_UPDATE',
      settings: next
    });
  };

  const selectTheme = (theme: CategoryTheme) => {
    if (!isHost) return;
    setStartError(null);
    const currentThemeIds = (settings.themeType !== 'album' && settings.themeType !== 'artist' && settings.themeIds)
      ? settings.themeIds
      : (settings.themeId ? [settings.themeId] : []);
    let nextThemeIds: string[];

    if (currentThemeIds.includes(theme.id)) {
      // Toggle off
      nextThemeIds = currentThemeIds.filter(id => id !== theme.id);
    } else {
      nextThemeIds = [...currentThemeIds, theme.id];
    }

    if (nextThemeIds.length === 0) {
      const next: RoomSettings = {
        ...settings,
        themeId: '',
        themeIds: [],
        themeType: 'playlist',
        themeName: '',
        themeIcon: '🎵',
        albumId: undefined,
        albumArtist: undefined,
        albumCover: undefined,
        albums: [],
        artists: []
      };
      setSettings(next);
      manager.sendEvent({
        type: 'SETTINGS_UPDATE',
        settings: next
      });
      return;
    }

    const selectedThemes = PRESET_THEMES.filter(t => nextThemeIds.includes(t.id));
    const isMulti = selectedThemes.length > 1;

    const next: RoomSettings = {
      ...settings,
      themeId: nextThemeIds[0],
      themeIds: nextThemeIds,
      themeType: isMulti ? 'mixed' : selectedThemes[0].type,
      themeName: isMulti ? selectedThemes.map(t => t.name).join(' + ') : selectedThemes[0].name,
      themeIcon: isMulti ? '🔀' : selectedThemes[0].icon,
      themeColor: isMulti ? 'linear-gradient(135deg, #ff007f, #7928ca, #00f2fe)' : selectedThemes[0].color,
      albumId: undefined,
      albumArtist: undefined,
      albumCover: undefined,
      albums: [],
      artists: []
    };
    setSettings(next);
    manager.sendEvent({
      type: 'SETTINGS_UPDATE',
      settings: next
    });
  };

  const selectArtist = (artist: { id: number | string; name: string; picture?: string; nb_fans?: number }) => {
    if (!isHost) return;
    setStartError(null);

    let currentArtists: { id: number | string; name: string; picture?: string; nb_fans?: number }[] = [];
    if (settings.themeType === 'artist' && settings.artists && settings.artists.length > 0) {
      currentArtists = [...settings.artists];
    }

    const isAlreadySelected = currentArtists.some(a => String(a.id) === String(artist.id));
    let nextArtists: typeof currentArtists;

    if (isAlreadySelected) {
      nextArtists = currentArtists.filter(a => String(a.id) !== String(artist.id));
    } else {
      nextArtists = [...currentArtists, artist];
    }

    if (nextArtists.length === 0) {
      const next: RoomSettings = {
        ...settings,
        themeId: 'artist-none',
        themeIds: [],
        themeType: 'artist',
        themeName: '',
        themeIcon: '🎤',
        themeColor: 'linear-gradient(135deg, #f093fb, #f5576c)',
        albumId: undefined,
        albumArtist: undefined,
        albumCover: undefined,
        albums: [],
        artists: []
      };
      setSettings(next);
      manager.sendEvent({
        type: 'SETTINGS_UPDATE',
        settings: next
      });
      return;
    }

    const isMulti = nextArtists.length > 1;
    const artistNames = nextArtists.map(a => a.name).join(' + ');

    const next: RoomSettings = {
      ...settings,
      themeId: isMulti ? `artist-multi-${nextArtists.map(a => a.id).join('-')}` : `artist-${nextArtists[0].id}`,
      themeIds: nextArtists.map(a => `artist-${a.id}`),
      themeType: 'artist',
      themeName: artistNames,
      themeIcon: isMulti ? '🎤🔀' : '🎤',
      themeColor: isMulti ? 'linear-gradient(135deg, #fa709a, #fee140, #ff0844)' : 'linear-gradient(135deg, #f093fb, #f5576c)',
      albumId: undefined,
      albumArtist: undefined,
      albumCover: undefined,
      albums: [],
      artists: nextArtists
    };
    setSettings(next);
    manager.sendEvent({
      type: 'SETTINGS_UPDATE',
      settings: next
    });
  };

  const selectAlbum = (album: { id: number | string; title: string; artistName: string; cover?: string }) => {
    if (!isHost) return;
    setStartError(null);

    let currentAlbums: { id: number | string; title: string; artistName: string; cover?: string }[] = [];
    if (settings.themeType === 'album' && settings.albums && settings.albums.length > 0) {
      currentAlbums = [...settings.albums];
    } else if (settings.themeType === 'album' && settings.albumId) {
      currentAlbums = [{
        id: settings.albumId,
        title: settings.themeName.split(' • ')[0] || settings.themeName,
        artistName: settings.albumArtist || '',
        cover: settings.albumCover
      }];
    }

    const isAlreadySelected = currentAlbums.some(a => String(a.id) === String(album.id));
    let nextAlbums: typeof currentAlbums;

    if (isAlreadySelected) {
      nextAlbums = currentAlbums.filter(a => String(a.id) !== String(album.id));
    } else {
      nextAlbums = [...currentAlbums, album];
    }

    if (nextAlbums.length === 0) {
      const next: RoomSettings = {
        ...settings,
        themeId: 'album-none',
        themeIds: [],
        themeType: 'album',
        themeName: '',
        themeIcon: '💿',
        themeColor: 'linear-gradient(135deg, #11998e, #38ef7d)',
        albumId: undefined,
        albumArtist: undefined,
        albumCover: undefined,
        albums: [],
        artists: []
      };
      setSettings(next);
      manager.sendEvent({
        type: 'SETTINGS_UPDATE',
        settings: next
      });
      return;
    }

    const isMulti = nextAlbums.length > 1;
    const albumTitles = nextAlbums.map(a => a.title).join(' + ');
    const artistNames = Array.from(new Set(nextAlbums.map(a => a.artistName))).join(', ');

    const next: RoomSettings = {
      ...settings,
      themeId: isMulti ? `album-multi-${nextAlbums.map(a => a.id).join('-')}` : `album-${nextAlbums[0].id}`,
      themeIds: nextAlbums.map(a => `album-${a.id}`),
      themeType: 'album',
      themeName: isMulti ? albumTitles : `${nextAlbums[0].title} • ${nextAlbums[0].artistName}`,
      themeIcon: isMulti ? '💿🔀' : '💿',
      themeColor: isMulti ? 'linear-gradient(135deg, #11998e, #38ef7d, #00f2fe)' : 'linear-gradient(135deg, #11998e, #38ef7d)',
      albumId: nextAlbums[0].id,
      albumArtist: artistNames,
      albumCover: nextAlbums[0].cover,
      albums: nextAlbums,
      artists: []
    };
    setSettings(next);
    manager.sendEvent({
      type: 'SETTINGS_UPDATE',
      settings: next
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(manager.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/?room=${encodeURIComponent(manager.roomCode)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isArtistMode = themeTab === 'artists' || settings.themeType === 'artist';
  const isAlbumMode = themeTab === 'albums' || settings.themeType === 'album';

  const hasValidSelection = isArtistMode
    ? Boolean(settings.artists && settings.artists.length > 0)
    : isAlbumMode
      ? Boolean(settings.albums && settings.albums.length > 0)
      : Boolean((settings.themeIds && settings.themeIds.length > 0) || (settings.themeId && settings.themeId !== ''));

  const handleHostLaunchGame = async () => {
    if (!isHost || isStarting) return;

    if (!hasValidSelection) {
      setStartError(
        isArtistMode
          ? "Veuillez sélectionner au moins un artiste pour lancer la partie."
          : isAlbumMode
            ? "Veuillez sélectionner au moins un album pour lancer la partie."
            : "Veuillez sélectionner au moins un thème pour lancer la partie."
      );
      return;
    }

    setIsStarting(true);
    setStartError(null);

    try {
      let selectedTracks: Track[] = [];
      let distractors: Track[] = [];

      if (settings.themeType === 'artist' || settings.themeId.startsWith('artist-')) {
        const artistsToFetch = (settings.artists && settings.artists.length > 0)
          ? settings.artists
          : [];

        if (artistsToFetch.length === 0) {
          setStartError("Veuillez sélectionner au moins un artiste pour lancer la partie.");
          setIsStarting(false);
          return;
        }

        const artistTracksPromises = artistsToFetch.map(a =>
          getArtistTracks(a.id, a.name)
        );
        const artistResultsList = await Promise.all(artistTracksPromises);
        const allFetchedTracks = artistResultsList.flat();

        const seen = new Set<string>();
        const uniqueTracks: Track[] = [];
        for (const tr of allFetchedTracks) {
          const key = `${tr.artist.name.toLowerCase().trim()}___${tr.title.toLowerCase().trim()}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueTracks.push(tr);
          }
        }

        if (uniqueTracks.length < 4) {
          setStartError(
            artistsToFetch.length > 1
              ? "Ces artistes ne contiennent pas assez d'extraits musicaux combinés. Essayez d'autres artistes."
              : "Cet artiste ne contient pas assez d'extraits musicaux. Essayez un autre artiste."
          );
          setIsStarting(false);
          return;
        }
        selectedTracks = uniqueTracks;
        distractors = [...uniqueTracks];

        // If artist pool has fewer than 12 tracks, supplement distractors from the chart
        if (distractors.length < 12) {
          try {
            const chartData = await getPlaylistTracks(PRESET_THEMES[0]);
            distractors = [...distractors, ...chartData.filter(c => !distractors.some(d => d.id === c.id))];
          } catch (_) {}
        }
      } else if (settings.themeType === 'album' || settings.themeId.startsWith('album-')) {
        const albumsToFetch = (settings.albums && settings.albums.length > 0)
          ? settings.albums
          : (settings.albumId
              ? [{
                  id: settings.albumId,
                  title: settings.themeName.split(' • ')[0] || settings.themeName,
                  artistName: settings.albumArtist || '',
                  cover: settings.albumCover
                }]
              : []);

        if (albumsToFetch.length === 0) {
          setStartError("Veuillez sélectionner au moins un album pour lancer la partie.");
          setIsStarting(false);
          return;
        }

        const albumTracksPromises = albumsToFetch.map(a =>
          getAlbumTracks(a.id, a.title, a.artistName, a.cover)
        );
        const albumResultsList = await Promise.all(albumTracksPromises);
        const allFetchedTracks = albumResultsList.flat();

        const seen = new Set<string>();
        const uniqueTracks: Track[] = [];
        for (const tr of allFetchedTracks) {
          const key = `${tr.artist.name.toLowerCase().trim()}___${tr.title.toLowerCase().trim()}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueTracks.push(tr);
          }
        }

        if (uniqueTracks.length < 4) {
          setStartError(
            albumsToFetch.length > 1
              ? "Ces albums ne contiennent pas assez d'extraits musicaux combinés. Essayez d'autres albums."
              : "Cet album ne contient pas assez d'extraits musicaux. Essayez un autre album."
          );
          setIsStarting(false);
          return;
        }
        selectedTracks = uniqueTracks;
        distractors = [...uniqueTracks];

        // If album pool has fewer than 12 tracks, supplement distractors from the chart so 4 choices always exist
        if (distractors.length < 12) {
          try {
            const chartData = await getPlaylistTracks(PRESET_THEMES[0]);
            distractors = [...distractors, ...chartData.filter(c => !distractors.some(d => d.id === c.id))];
          } catch (_) {}
        }
      } else {
        const currentThemeIds = (settings.themeIds && settings.themeIds.length > 0)
          ? settings.themeIds
          : (settings.themeId ? [settings.themeId] : []);

        if (currentThemeIds.length === 0) {
          setStartError("Veuillez sélectionner au moins un thème pour lancer la partie.");
          setIsStarting(false);
          return;
        }

        const selectedThemes = PRESET_THEMES.filter(t => currentThemeIds.includes(t.id));
        if (selectedThemes.length === 0) {
          setStartError("Veuillez sélectionner au moins un thème pour lancer la partie.");
          setIsStarting(false);
          return;
        }

        if (selectedThemes.length > 1) {
          // Multi-theme selection: combine playlists!
          const mixedTheme: CategoryTheme = {
            id: `mixed-${selectedThemes.map(t => t.id).join('-')}`,
            name: selectedThemes.map(t => t.name).join(' + '),
            description: `Mix combiné de ${selectedThemes.length} playlists`,
            icon: '🔀',
            type: 'mixed',
            combinedThemes: selectedThemes,
            color: settings.themeColor
          };
          const tr = await getPlaylistTracks(mixedTheme);
          selectedTracks = tr;
          distractors = tr;
        } else {
          const currentTheme = selectedThemes[0] || PRESET_THEMES[0];
          if (currentTheme.deezerId) {
            const tr = await getPlaylistTracks(currentTheme);
            selectedTracks = tr;
            distractors = tr;
          }
        }
      }

      if (selectedTracks.length < 4) {
        setStartError("Impossible de charger assez de morceaux. Essayez d'autres sélections.");
        setIsStarting(false);
        return;
      }

      const trackCount = Math.min(settings.trackCount, selectedTracks.length);
      const shuffled = [...selectedTracks].sort(() => Math.random() - 0.5).slice(0, trackCount);
      const startTimestamp = Date.now() + 3500; // 3.5s synchronized countdown

      // Prepare Question 0 immediately so both Host and Guests start synchronously
      const track0 = shuffled[0];
      const otherTracks = distractors.filter(t => t.id !== track0.id && t.title !== track0.title);
      const shuffledOthers = [...otherTracks].sort(() => Math.random() - 0.5).slice(0, 3);

      const correctOpt: Option = {
        id: track0.id,
        title: track0.title,
        artistName: track0.artist.name,
        isTrackTitle: true
      };

      const distractorOpts: Option[] = shuffledOthers.map((t, idx) => ({
        id: `dist_${idx}_${t.id}`,
        title: t.title,
        artistName: t.artist.name,
        isTrackTitle: true
      }));

      const options = [correctOpt, ...distractorOpts].sort(() => Math.random() - 0.5);

      const initialQuestion = {
        questionIndex: 0,
        startTime: startTimestamp,
        correctOptionId: correctOpt.id,
        correctOption: correctOpt,
        options
      };

      // CRITICAL FIX: Trim distractorPool to max 25 lightweight items so WebSocket broadcast stays tiny (< 15 KB)
      // and Supabase Realtime NEVER drops or rejects the broadcast when mixing multiple playlists, albums, or artists!
      const compactDistractorPool: Track[] = distractors
        .filter(t => !shuffled.some(s => s.id === t.id))
        .slice(0, 25)
        .map(t => ({
          id: t.id,
          title: t.title,
          artist: {
            id: t.artist?.id || '',
            name: t.artist?.name || ''
          },
          album: {
            id: t.album?.id || '',
            title: t.album?.title || '',
            cover_medium: t.album?.cover_medium,
            cover_big: t.album?.cover_big
          },
          preview: ''
        }));

      // Broadcast start event to all guests with Question 0 included
      await manager.sendEvent({
        type: 'GAME_STARTING',
        settings,
        tracks: shuffled,
        distractorPool: compactDistractorPool,
        startTimestamp,
        initialQuestion
      });

      // Small buffer to guarantee network packet leaves socket before host navigates
      await new Promise(r => setTimeout(r, 150));

      // Launch locally on host
      onStartGame(settings, shuffled, compactDistractorPool, initialQuestion);
    } catch (err) {
      console.error(err);
      setStartError("Erreur réseau lors de la récupération des morceaux.");
      setIsStarting(false);
    }
  };

  return (
    <div className="lobby-container">
      {/* Top Header */}
      <div className="lobby-header-bar">
        <div className="lobby-code-badge-group">
          <span className="lobby-code-label">Salon :</span>
          <span className="lobby-code-value">{manager.roomCode}</span>
          <button
            onClick={handleCopyCode}
            className="lobby-code-action-btn"
            title="Copier le code"
            aria-label="Copier le code"
          >
            {copiedCode ? <Check className="icon-xs text-success" /> : <Copy className="icon-xs" />}
          </button>
          <button
            onClick={handleCopyLink}
            className="lobby-code-action-btn"
            title="Partager le lien d'invitation"
            aria-label="Partager le lien"
          >
            {copiedLink ? <Check className="icon-xs text-success" /> : <Share2 className="icon-xs" />}
          </button>
        </div>

        <button className="btn-secondary btn-sm lobby-leave-btn" onClick={onLeaveRoom}>
          <LogOut className="icon-xs" /> Quitter
        </button>
      </div>

      <div className="lobby-grid">
        {/* LEFT COLUMN: Players in room */}
        <div className="lobby-panel players-panel">
          <div className="lobby-panel-header">
            <div className="lobby-panel-title">
              <Users className="icon-sm text-cyan" />
              <h3>Joueurs connectés ({players.length})</h3>
            </div>
            <span className="live-status-pill">
              <span className="pulse-dot" /> En direct
            </span>
          </div>

          <div className="lobby-players-list">
            {players.map((player) => (
              <div
                key={player.id}
                className={`lobby-player-row ${player.id === manager.myPlayerId ? 'is-me' : ''}`}
              >
                <div className="player-avatar-circle">{player.avatar}</div>
                <div className="player-row-info">
                  <span className="player-row-name">
                    {player.name}
                    {player.id === manager.myPlayerId && <span className="you-tag">(Moi)</span>}
                  </span>
                  {player.isHost && (
                    <span className="host-badge">
                      <Crown className="icon-xs text-gold" /> Hôte
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="lobby-share-invite-box">
            <p className="invite-desc">Invite tes amis en leur partageant le code :</p>
            <div className="invite-code-pill" onClick={handleCopyCode}>
              <strong>{manager.roomCode}</strong>
              <Copy className="icon-xs text-muted" />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Settings / Status */}
        <div className="lobby-panel settings-panel">
          {!isHost && (
            <div className="guest-lobby-overlay">
              <div className="guest-overlay-card">
                <div className="guest-spinner-wrapper">
                  <div className="guest-custom-spinner" />
                </div>
                <h4 className="guest-overlay-title">L'hôte configure la partie...</h4>
                <p className="guest-overlay-desc">
                  Le blind test débutera dès que l'hôte aura lancé la partie.
                </p>
                <div className="guest-overlay-summary-pill">
                  <span className="guest-pill-icon">{settings.themeIcon || '🎵'}</span>
                  <span className="guest-pill-theme">{settings.themeName || 'Choix du thème en cours...'}</span>
                  <span className="guest-pill-sep">•</span>
                  <span className="guest-pill-mode">
                    {settings.trackCount} titres • {settings.gameplayMode === 'buzzer' ? '⚡ Buzzer Express' : '🏆 Classique'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="lobby-panel-header">
            <div className="lobby-panel-title">
              <Music2 className="icon-sm text-pink" />
              <h3>Paramètres de la partie</h3>
            </div>
          </div>

          {/* Theme selector */}
          <div className="settings-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <label className="section-label" style={{ margin: 0 }}>Thème(s) musical :</label>
              {isHost && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                  {themeTab === 'presets'
                    ? (settings.themeIds && settings.themeIds.length > 1
                        ? `🔀 ${settings.themeIds.length} styles combinés`
                        : (settings.themeIds && settings.themeIds.length === 1
                            ? `🎙️ ${settings.themeName}`
                            : '👉 Choisissez un ou plusieurs thèmes'))
                    : themeTab === 'artists'
                      ? (settings.artists && settings.artists.length > 1
                          ? `🎤 ${settings.artists.length} artistes combinés`
                          : (settings.artists && settings.artists.length === 1
                              ? `🎤 ${settings.themeName}`
                              : '👉 Choisissez un ou plusieurs artistes'))
                      : (settings.albums && settings.albums.length > 1
                          ? `💿 ${settings.albums.length} albums combinés`
                          : (settings.albums && settings.albums.length === 1
                              ? `💿 ${settings.themeName}`
                              : '👉 Choisissez un ou plusieurs albums'))}
                </span>
              )}
            </div>

            {/* Active Theme Placeholder (Presets mode with 0 selected) */}
            {themeTab === 'presets' && (!settings.themeIds || settings.themeIds.length === 0) && (
              <div className="lobby-active-album-card empty-album-selection">
                <div className="lobby-active-album-cover">
                  <span>🎵</span>
                </div>
                <div className="lobby-active-album-details">
                  <span className="lobby-active-album-tag" style={{ color: 'var(--accent-cyan)' }}>
                    Aucun thème sélectionné
                  </span>
                  <h4 className="lobby-active-album-title" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Cliquez sur un ou plusieurs thèmes ci-dessous pour composer la partie
                  </h4>
                </div>
              </div>
            )}

            {/* Active Artist Banner (Artists mode) */}
            {themeTab === 'artists' && (
              settings.artists && settings.artists.length > 0 ? (
                <div className="lobby-active-album-card lobby-active-artist-card">
                  {settings.artists.length > 1 ? (
                    <div className="lobby-active-album-covers-stack">
                      {settings.artists.slice(0, 3).map((art, idx) => (
                        <div
                          key={art.id}
                          className="lobby-stacked-cover-wrapper lobby-stacked-artist-wrapper"
                          style={{ zIndex: 5 - idx, marginLeft: idx > 0 ? '-14px' : '0' }}
                        >
                          {art.picture ? (
                            <img
                              src={art.picture}
                              alt={art.name}
                              className="lobby-stacked-cover lobby-stacked-artist-cover"
                              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            />
                          ) : (
                            <span className="lobby-stacked-fallback">🎤</span>
                          )}
                        </div>
                      ))}
                      {settings.artists.length > 3 && (
                        <span className="lobby-stacked-more">+{settings.artists.length - 3}</span>
                      )}
                    </div>
                  ) : (
                    <div className="lobby-active-album-cover lobby-active-artist-cover">
                      {settings.artists[0].picture ? (
                        <img
                          src={settings.artists[0].picture}
                          alt={settings.themeName}
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <span>🎤</span>
                      )}
                    </div>
                  )}
                  <div className="lobby-active-album-details">
                    <span className="lobby-active-album-tag" style={{ color: '#f5576c' }}>
                      {settings.artists.length > 1
                        ? `🎤 Duel / Mix d'artistes (${settings.artists.length} sélectionnés)`
                        : '🎤 Artiste sélectionné'}
                    </span>
                    <h4 className="lobby-active-album-title">{settings.themeName}</h4>
                  </div>
                </div>
              ) : (
                <div className="lobby-active-album-card empty-album-selection">
                  <div className="lobby-active-album-cover lobby-active-artist-cover">
                    <span>🎤</span>
                  </div>
                  <div className="lobby-active-album-details">
                    <span className="lobby-active-album-tag" style={{ color: '#f5576c' }}>
                      Aucun artiste sélectionné
                    </span>
                    <h4 className="lobby-active-album-title" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Cliquez sur un ou plusieurs artistes ci-dessous pour composer la partie
                    </h4>
                  </div>
                </div>
              )
            )}

            {/* Active Album Banner (Albums mode) */}
            {themeTab === 'albums' && (
              settings.albums && settings.albums.length > 0 ? (
                <div className="lobby-active-album-card">
                  {settings.albums.length > 1 ? (
                    <div className="lobby-active-album-covers-stack">
                      {settings.albums.slice(0, 3).map((alb, idx) => (
                        <div
                          key={alb.id}
                          className="lobby-stacked-cover-wrapper"
                          style={{ zIndex: 5 - idx, marginLeft: idx > 0 ? '-14px' : '0' }}
                        >
                          {alb.cover ? (
                            <img
                              src={alb.cover}
                              alt={alb.title}
                              className="lobby-stacked-cover"
                              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            />
                          ) : (
                            <span className="lobby-stacked-fallback">💿</span>
                          )}
                        </div>
                      ))}
                      {settings.albums.length > 3 && (
                        <span className="lobby-stacked-more">+{settings.albums.length - 3}</span>
                      )}
                    </div>
                  ) : (
                    <div className="lobby-active-album-cover">
                      {settings.albumCover ? (
                        <img
                          src={settings.albumCover}
                          alt={settings.themeName}
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <span>💿</span>
                      )}
                    </div>
                  )}
                  <div className="lobby-active-album-details">
                    <span className="lobby-active-album-tag">
                      {settings.albums.length > 1
                        ? `💿 Mix d'albums (${settings.albums.length} sélectionnés)`
                        : '💿 Album sélectionné'}
                    </span>
                    <h4 className="lobby-active-album-title">{settings.themeName}</h4>
                    {settings.albumArtist && (
                      <span className="lobby-active-album-artist">{settings.albumArtist}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="lobby-active-album-card empty-album-selection">
                  <div className="lobby-active-album-cover">
                    <span>💿</span>
                  </div>
                  <div className="lobby-active-album-details">
                    <span className="lobby-active-album-tag" style={{ color: 'var(--accent-cyan)' }}>
                      Aucun album sélectionné
                    </span>
                    <h4 className="lobby-active-album-title" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Cliquez sur un ou plusieurs albums ci-dessous pour composer la partie
                    </h4>
                  </div>
                </div>
              )
            )}

            {/* Theme Tabs (Playlists vs Artists vs Albums) */}
            {isHost && (
              <div className="lobby-theme-tabs">
                <button
                  type="button"
                  className={`lobby-theme-tab-btn ${themeTab === 'presets' ? 'active' : ''}`}
                  onClick={switchToPresets}
                >
                  <Music2 className="icon-xs" /> Playlists ({PRESET_THEMES.length})
                </button>
                <button
                  type="button"
                  className={`lobby-theme-tab-btn ${themeTab === 'artists' ? 'active' : ''}`}
                  onClick={switchToArtists}
                >
                  <Mic2 className="icon-xs" /> Artistes ({POPULAR_ARTISTS.length}+)
                </button>
                <button
                  type="button"
                  className={`lobby-theme-tab-btn ${themeTab === 'albums' ? 'active' : ''}`}
                  onClick={switchToAlbums}
                >
                  <Disc3 className="icon-xs" /> Albums ({POPULAR_ALBUMS.length}+)
                </button>
              </div>
            )}

            {/* Content: Playlists */}
            {themeTab === 'presets' && (
              <div className="themes-mini-grid">
                {PRESET_THEMES.map((t) => {
                  const currentThemeIds = settings.themeIds || [settings.themeId];
                  const isSelected = currentThemeIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      disabled={!isHost}
                      onClick={() => selectTheme(t)}
                      className={`theme-mini-chip ${isSelected ? 'active' : ''}`}
                      style={{
                        borderColor: isSelected ? 'var(--accent-cyan)' : undefined,
                        background: isSelected ? 'rgba(0, 242, 254, 0.18)' : undefined
                      }}
                    >
                      <span className="theme-mini-icon">{t.icon}</span>
                      <span className="theme-mini-name">{t.name}</span>
                      {isSelected && currentThemeIds.length > 1 && (
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 900 }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Content: Artists */}
            {themeTab === 'artists' && (
              <div className="lobby-albums-container">
                {isHost && (
                  <div className="lobby-album-search-wrapper">
                    <Search className="icon-xs text-muted lobby-album-search-icon" />
                    <input
                      type="text"
                      className="lobby-album-search-input"
                      placeholder="Rechercher un artiste (ex: Ninho, Jul, Rihanna, Eminem...)"
                      value={artistQuery}
                      onChange={(e) => setArtistQuery(e.target.value)}
                    />
                    {isSearchingArtists && <Loader2 className="spinner-mini lobby-album-search-spinner" />}
                  </div>
                )}

                {/* Artist Search Results */}
                {artistResults.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Résultats de recherche :
                    </span>
                    <div className="lobby-album-grid" style={{ marginTop: '0.35rem' }}>
                      {artistResults.map((art) => {
                        const isSelected = settings.themeType === 'artist' && (
                          settings.artists && settings.artists.some(a => String(a.id) === String(art.id))
                        );
                        return (
                          <button
                            key={art.id}
                            type="button"
                            disabled={!isHost}
                            onClick={() => selectArtist(art)}
                            className={`lobby-album-chip lobby-artist-chip ${isSelected ? 'active' : ''}`}
                          >
                            <div className="lobby-album-thumb-container lobby-artist-thumb-container">
                              <img
                                src={art.picture}
                                alt={art.name}
                                className="lobby-album-thumb lobby-artist-thumb"
                                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                              />
                              {isSelected && <span className="lobby-album-check-badge">✓</span>}
                            </div>
                            <div className="lobby-album-meta">
                              <span className="lobby-album-name">{art.name}</span>
                              {art.nb_fans ? (
                                <span className="lobby-album-artist">
                                  {art.nb_fans >= 1000000
                                    ? `${(art.nb_fans / 1000000).toFixed(1)}M fans`
                                    : `${Math.round(art.nb_fans / 1000)}k fans`}
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Preset Iconic Artists */}
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Artistes populaires :
                  </span>
                  <div className="lobby-album-grid" style={{ marginTop: '0.35rem' }}>
                    {POPULAR_ARTISTS.map((art) => {
                      const isSelected = settings.themeType === 'artist' && (
                        settings.artists && settings.artists.some(a => String(a.id) === String(art.id))
                      );
                      return (
                        <button
                          key={art.id}
                          type="button"
                          disabled={!isHost}
                          onClick={() => selectArtist(art)}
                          className={`lobby-album-chip lobby-artist-chip ${isSelected ? 'active' : ''}`}
                        >
                          <div className="lobby-album-thumb-container lobby-artist-thumb-container">
                            <img
                              src={art.picture}
                              alt={art.name}
                              className="lobby-album-thumb lobby-artist-thumb"
                              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            />
                            {isSelected && <span className="lobby-album-check-badge">✓</span>}
                          </div>
                          <div className="lobby-album-meta">
                            <span className="lobby-album-name">{art.name}</span>
                            <span className="lobby-album-artist">{art.genre}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Content: Albums */}
            {themeTab === 'albums' && (
              <div className="lobby-albums-container">
                {isHost && (
                  <div className="lobby-album-search-wrapper">
                    <Search className="icon-xs text-muted lobby-album-search-icon" />
                    <input
                      type="text"
                      className="lobby-album-search-input"
                      placeholder="Rechercher un album (ex: PNL, Daft Punk, Orelsan...)"
                      value={albumQuery}
                      onChange={(e) => setAlbumQuery(e.target.value)}
                    />
                    {isSearchingAlbums && <Loader2 className="spinner-mini lobby-album-search-spinner" />}
                  </div>
                )}

                {/* Album Search Results */}
                {albumResults.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Résultats de recherche :
                    </span>
                    <div className="lobby-album-grid" style={{ marginTop: '0.35rem' }}>
                      {albumResults.map((alb) => {
                        const isSelected = settings.themeType === 'album' && (
                          settings.albums && settings.albums.length > 0
                            ? settings.albums.some(a => String(a.id) === String(alb.id))
                            : (String(settings.albumId) === String(alb.id) || settings.themeId === `album-${alb.id}`)
                        );
                        return (
                          <button
                            key={alb.id}
                            type="button"
                            disabled={!isHost}
                            onClick={() => selectAlbum(alb)}
                            className={`lobby-album-chip ${isSelected ? 'active' : ''}`}
                          >
                            <div className="lobby-album-thumb-container">
                              <img
                                src={alb.cover}
                                alt={alb.title}
                                className="lobby-album-thumb"
                                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                              />
                              {isSelected && <span className="lobby-album-check-badge">✓</span>}
                            </div>
                            <div className="lobby-album-meta">
                              <span className="lobby-album-name">{alb.title}</span>
                              <span className="lobby-album-artist">{alb.artistName}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Preset Iconic Albums */}
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Albums cultes populaires :
                  </span>
                  <div className="lobby-album-grid" style={{ marginTop: '0.35rem' }}>
                    {POPULAR_ALBUMS.map((alb) => {
                      const isSelected = settings.themeType === 'album' && (
                        settings.albums && settings.albums.length > 0
                          ? settings.albums.some(a => String(a.id) === String(alb.id))
                          : (String(settings.albumId) === String(alb.id) || settings.themeId === `album-${alb.id}`)
                      );
                      return (
                        <button
                          key={alb.id}
                          type="button"
                          disabled={!isHost}
                          onClick={() => selectAlbum(alb)}
                          className={`lobby-album-chip ${isSelected ? 'active' : ''}`}
                        >
                          <div className="lobby-album-thumb-container">
                            <img
                              src={alb.cover}
                              alt={alb.title}
                              className="lobby-album-thumb"
                              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            />
                            {isSelected && <span className="lobby-album-check-badge">✓</span>}
                          </div>
                          <div className="lobby-album-meta">
                            <span className="lobby-album-name">{alb.title}</span>
                            <span className="lobby-album-artist">{alb.artistName}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Gameplay mode */}
          <div className="settings-section">
            <label className="section-label">Mode de jeu :</label>
            <div className="gameplay-mode-selector">
              <button
                disabled={!isHost}
                onClick={() => updateSetting('gameplayMode', 'buzzer')}
                className={`mode-choice-btn ${settings.gameplayMode === 'buzzer' ? 'active' : ''}`}
              >
                <div className="mode-btn-header">
                  <span className="mode-emoji">⚡</span>
                  <strong>Buzzer Express</strong>
                </div>
                <span className="mode-btn-desc">Le premier qui trouve vole le point et bloque les autres !</span>
              </button>

              <button
                disabled={!isHost}
                onClick={() => updateSetting('gameplayMode', 'everyone')}
                className={`mode-choice-btn ${settings.gameplayMode === 'everyone' ? 'active' : ''}`}
              >
                <div className="mode-btn-header">
                  <span className="mode-emoji">🏆</span>
                  <strong>Classique (Chacun répond)</strong>
                </div>
                <span className="mode-btn-desc">Tout le monde peut répondre et gagne des points selon sa rapidité.</span>
              </button>
            </div>
          </div>

          {/* Track count */}
          <div className="settings-section">
            <label className="section-label">Nombre de morceaux :</label>
            <div className="track-counts-row">
              {[5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  disabled={!isHost}
                  onClick={() => updateSetting('trackCount', num)}
                  className={`count-pill-btn ${settings.trackCount === num ? 'active' : ''}`}
                >
                  {num} titres
                </button>
              ))}
            </div>
          </div>

          {startError && (
            <div className="auth-alert error-alert">
              <ShieldAlert className="icon-xs" /> {startError}
            </div>
          )}

          {/* Bottom Action Button (Host only) */}
          {isHost && (
            <div className="lobby-launch-footer">
              <button
                className="btn-primary lobby-start-btn"
                onClick={handleHostLaunchGame}
                disabled={isStarting || !hasValidSelection}
                style={{
                  opacity: (!hasValidSelection || isStarting) ? 0.65 : 1,
                  cursor: (!hasValidSelection || isStarting) ? 'not-allowed' : 'pointer'
                }}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="spinner-icon" /> Chargement des titres...
                  </>
                ) : !hasValidSelection ? (
                  <>
                    <Play className="icon-sm" /> Sélectionnez au moins un {isAlbumMode ? 'album' : 'thème'}
                  </>
                ) : (
                  <>
                    <Play className="icon-sm" /> Lancer la partie ({players.length} joueur{players.length > 1 ? 's' : ''})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
