const API_BASE = 'https://webbcrew.ru/api';

async function fetchApi(url, method = 'GET', body = null) {
  const token = localStorage.getItem('auth_token');
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };


  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${url}`, options);
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        const error = new Error('Требуется авторизация. Пожалуйста, войдите в систему.');
        error.statusCode = 401;
        throw error;
      }
      
      const errorMessage = `Ошибка запроса: ${response.status}`;
      const error = new Error(errorMessage);
      error.statusCode = response.status;
      throw error;
    }
    
    try {
      const data = await response.json();
      if (data && data.statusCode && data.statusCode >= 200 && data.statusCode < 300 && data.payload !== undefined) {
        return data;
      }
      
      return data;
    } catch (e) {
      return {};
    }
  } catch (error) {
    throw error;
  }
}

export const loginUser = async (username, password) => {
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include', 
    });
    
    if (!response.ok) {
      let errorMsg = 'Ошибка входа';
      
      if (response.status === 401 || response.status === 400) {
        errorMsg = 'Неверное имя пользователя или пароль';
      } else if (response.status === 404) {
        errorMsg = 'Пользователь не найден';
      } else {
        errorMsg = `Ошибка входа: ${response.status}`;
      }
      
      const error = new Error(errorMsg);
      error.statusCode = response.status;
      throw error;
    }
    
    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('username', username);
      
      if (data.user && data.user.id) {
        localStorage.setItem('user_id', data.user.id);
      }
      
      return { success: true, user: data.user || { username } };
    } else if (data.accessToken) {
      localStorage.setItem('auth_token', data.accessToken);
      localStorage.setItem('username', username);
      
      if (data.user && data.user.id) {
        localStorage.setItem('user_id', data.user.id);
      }
      
      return { success: true, user: data.user || { username } };
    } else {
      localStorage.setItem('auth_token', 'session_auth');
      localStorage.setItem('username', username);
      return { success: true, sessionAuth: true, user: { username } };
    }
  } catch (error) {
    throw error;
  }
};


export const registerUser = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      let errorMsg = 'Ошибка регистрации';
      
      if (response.status === 409) {
        errorMsg = 'Пользователь с таким именем уже существует';
      } else if (response.status === 400) {
        errorMsg = 'Некорректные данные для регистрации';
      } else {
        errorMsg = `Ошибка регистрации: ${response.status}`;
      }
      
      const error = new Error(errorMsg);
      error.statusCode = response.status;
      throw error;
    }
    
    return loginUser(username, password);
  } catch (error) {
    throw error;
  }
};


export const logout = async () => {
  try {
    
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        credentials: 'include',
      });
    } catch (e) {
      
    }
  } finally {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    localStorage.removeItem('user_id');
  }
};


export const checkAuthentication = async () => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return false;
  }
  
  try {
    
    const response = await fetch(`${API_BASE}/check-auth`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
};


export const fetchAlbums = () => fetchApi('/albums');
export const fetchAlbumTracks = (albumId) => fetchApi(`/albums/${albumId}/tracks`);
export const searchTracks = (query) => fetchApi(`/tracks/search?name=${encodeURIComponent(query)}`);
export const searchAlbums = async (query) => {
  try {
    const data = await fetchAlbums();
    let albums = [];
    if (Array.isArray(data)) {
      albums = data;
    } else if (data?.payload && Array.isArray(data.payload)) {
      albums = data.payload;
    }
    
    const filteredAlbums = albums.filter(album => {
      const title = (album.Title || '').toLowerCase();
      const artist = (album.ArtistName || '').toLowerCase();
      const query_lower = query.toLowerCase();
      
      return title.includes(query_lower) || artist.includes(query_lower);
    });
    
    return {
      statusCode: 200,
      payload: filteredAlbums
    };
  } catch (error) {
    return {
      statusCode: 500,
      error: error.message,
      payload: []
    };
  }
};

export const searchAll = async (query) => {
  try {
    const [tracksResponse, albumsResponse] = await Promise.all([
      searchTracks(query),
      searchAlbums(query)
    ]);
    
    let tracks = [];
    if (Array.isArray(tracksResponse)) {
      tracks = tracksResponse;
    } else if (tracksResponse?.payload && Array.isArray(tracksResponse.payload)) {
      tracks = tracksResponse.payload;
    }
    
    let albums = [];
    if (Array.isArray(albumsResponse)) {
      albums = albumsResponse;
    } else if (albumsResponse?.payload && Array.isArray(albumsResponse.payload)) {
      albums = albumsResponse.payload;
    }
    
    return {
      tracks,
      albums,
      success: true
    };
  } catch (error) {
    return {
      tracks: [],
      albums: [],
      success: false,
      error: error.message
    };
  }
};


export const fetchFavorites = () => fetchApi('/favorites');

export const addToFavorites = async (trackId, trackData) => {
  try {
    const favorites = await fetchFavorites();
    let tracks = [];
    if (Array.isArray(favorites)) {
      tracks = favorites;
    } else if (favorites?.payload && Array.isArray(favorites.payload)) {
      tracks = favorites.payload;
    }
    const trackIdStr = String(trackId);
    const trackExists = tracks.some(track => {
      const existingId = String(track.id || track.ID);
      return existingId === trackIdStr;
    });
    
    if (trackExists) {
      return { success: false, message: 'Трек уже существует в избранном' };
    }
    
    const enhancedTrackData = { ...trackData };
    
    if (trackData && trackData.albumId) {
      enhancedTrackData.albumId = trackData.albumId;
    } else if (trackData && trackData.album_id) {
      enhancedTrackData.albumId = trackData.album_id;
      enhancedTrackData.album_id = trackData.album_id;
    }
    
    if (enhancedTrackData.albumId && !enhancedTrackData.album_id) {
      enhancedTrackData.album_id = enhancedTrackData.albumId;
    }

    return fetchApi(`/favorites/${trackId}`, 'POST', enhancedTrackData);
  } catch (error) {
    throw error;
  }
};

export const removeFromFavorites = (trackId) => fetchApi(`/favorites/${trackId}`, 'DELETE');


export const clearAllFavorites = async () => {
  try {
    const favorites = await fetchFavorites();
    let tracks = [];
    if (Array.isArray(favorites)) {
      tracks = favorites;
    } else if (favorites?.payload && Array.isArray(favorites.payload)) {
      tracks = favorites.payload;
    }
    
    const deletePromises = tracks.map(track => 
      removeFromFavorites(track.id || track.ID)
    );
    
    await Promise.all(deletePromises);
    
    return { success: true, message: 'Все треки удалены из избранного' };
  } catch (error) {
    throw error;
  }
};


export const fetchFavoriteAlbums = () => {

  const userId = localStorage.getItem('user_id') || localStorage.getItem('username') || 'guest';
  
  const albums = localStorage.getItem(`favorite_albums_${userId}`);
  try {
    return albums ? JSON.parse(albums) : [];
  } catch (e) {
    return [];
  }
};

export const addAlbumToFavorites = (albumId, albumData) => {
  const userId = localStorage.getItem('user_id') || localStorage.getItem('username') || 'guest';
  const albums = fetchFavoriteAlbums();
  const existingAlbumIndex = albums.findIndex(album => 
    album.ID === albumId || album.id === albumId);
  
  if (existingAlbumIndex >= 0) {
    albums[existingAlbumIndex] = { ...albums[existingAlbumIndex], ...albumData };
  } else {
    albums.push({ ...albumData, ID: albumId });
  }
  
  localStorage.setItem(`favorite_albums_${userId}`, JSON.stringify(albums));
  return { success: true, payload: albums };
};

export const removeAlbumFromFavorites = (albumId) => {
  const userId = localStorage.getItem('user_id') || localStorage.getItem('username') || 'guest';
  const albums = fetchFavoriteAlbums();
  const updatedAlbums = albums.filter(album => 
    album.ID !== albumId && album.id !== albumId);
  localStorage.setItem(`favorite_albums_${userId}`, JSON.stringify(updatedAlbums));
  return { success: true, payload: updatedAlbums };
};

export const getPlaylistsFromLocalStorage = () => {
  const userId = localStorage.getItem('user_id') || localStorage.getItem('username') || 'guest';
  const playlists = localStorage.getItem(`user_playlists_${userId}`);
  try {
    return playlists ? JSON.parse(playlists) : [];
  } catch (e) {
    return [];
  }
};

export const savePlaylistsToLocalStorage = (playlists) => {
  const userId = localStorage.getItem('user_id') || localStorage.getItem('username') || 'guest';
  localStorage.setItem(`user_playlists_${userId}`, JSON.stringify(playlists));
  return { success: true, payload: playlists };
};

export const fetchPlaylists = () => {
  try {
    return getPlaylistsFromLocalStorage();
  } catch (error) {
    return [];
  }
};

export const searchPlaylists = async (query) => {
  try {
    const playlists = getPlaylistsFromLocalStorage();
    const filteredPlaylists = playlists.filter(playlist => {
      const title = String(playlist.title || playlist.Title || '').toLowerCase();
      return title.includes(query.toLowerCase());
    });
    
    return { success: true, payload: filteredPlaylists };
  } catch (error) {
    return { success: false, error: error.message, payload: [] };
  }
};

export const createPlaylist = (title) => {
  try {
    const playlists = getPlaylistsFromLocalStorage();
    const newId = `playlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newPlaylist = { 
      ID: newId, 
      id: newId,
      Title: title, 
      title: title,
      tracks: [] 
    };
    playlists.push(newPlaylist);
    savePlaylistsToLocalStorage(playlists);
    return { success: true, payload: newPlaylist };
  } catch (error) {
    throw error;
  }
};


export const deletePlaylist = async (playlistId) => {
  try {
    const playlists = getPlaylistsFromLocalStorage();
    const updatedPlaylists = playlists.filter(playlist => 
      playlist.ID !== playlistId && playlist.id !== playlistId);
    savePlaylistsToLocalStorage(updatedPlaylists);
    return { success: true, message: 'Плейлист удален' };
  } catch (error) {
    throw error;
  }
};

export const fetchPlaylistTracks = (playlistId) => {
  try {
    const playlists = getPlaylistsFromLocalStorage();
    const playlist = playlists.find(p => 
      p.ID === playlistId || p.id === playlistId);
    
    if (!playlist) {
      return [];
    }
    
    return playlist.tracks || [];
  } catch (error) {
    return [];
  }
};

export const addTrackToPlaylist = async (playlistId, trackId, trackData) => {
  try {
    const playlists = getPlaylistsFromLocalStorage();
    const playlistIndex = playlists.findIndex(p => 
      p.ID === playlistId || p.id === playlistId);
    
    if (playlistIndex === -1) {
      throw new Error(`Плейлист с ID ${playlistId} не найден`);
    }
    
    if (!playlists[playlistIndex].tracks) {
      playlists[playlistIndex].tracks = [];
    }
    
    const trackIdStr = String(trackId);
    const trackExists = playlists[playlistIndex].tracks.some(track => {
      const existingId = String(track.id || track.ID);
      return existingId === trackIdStr;
    });
    
    const trackExistsByMetadata = !trackExists && trackData && playlists[playlistIndex].tracks.some(track => {
      const titleMatch = (track.title || track.Title) === (trackData.title || trackData.Title);
      const artistMatch = (track.artist || track.Artist) === (trackData.artist || trackData.Artist);
      const albumMatch = (track.album || track.Album) === (trackData.album || trackData.Album);

      return titleMatch && artistMatch && albumMatch;
    });
    
    if (trackExists || trackExistsByMetadata) {
      return { success: false, message: 'Трек уже существует в плейлисте' };
    }
    
    playlists[playlistIndex].tracks.push({
      ...trackData,
      id: trackId,
      ID: trackId
    });
    
    savePlaylistsToLocalStorage(playlists);
    
    return { success: true, message: 'Трек добавлен в плейлист' };
  } catch (error) {
    throw error;
  }
};

export const removeTrackFromPlaylist = (playlistId, trackId) => {
  try {
    const playlists = getPlaylistsFromLocalStorage();
    const playlistIndex = playlists.findIndex(p => 
      p.ID === playlistId || p.id === playlistId);
    
    if (playlistIndex === -1) {
      throw new Error(`Плейлист с ID ${playlistId} не найден`);
    }
    
    if (!playlists[playlistIndex].tracks) {
      playlists[playlistIndex].tracks = [];
      return { success: true, message: 'Плейлист не содержит треков' };
    }
    
    playlists[playlistIndex].tracks = playlists[playlistIndex].tracks.filter(track => 
      track.id !== trackId && track.ID !== trackId);
    
    savePlaylistsToLocalStorage(playlists);
    
    return { success: true, message: 'Трек удален из плейлиста' };
  } catch (error) {
    throw error;
  }
};


