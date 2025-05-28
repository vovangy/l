import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './MyMusic.css';
import '../common.css';
import Spots from '../Spots/Spots';
import Player from '../Player/Player';
import AuthMessage from '../AuthMessage/AuthMessage';
import { fetchFavorites, removeFromFavorites, fetchPlaylists, addTrackToPlaylist, clearAllFavorites, createPlaylist, searchTracks } from '../Api/apiService';
import { useAuth } from '../../AuthContext/AuthContext';
import Menu from '../Menu/Menu';

const MyMusic = ({ toggleMenu }) => {
  const [favorites, setFavorites] = useState([]);
  const [filteredFavorites, setFilteredFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showOptions, setShowOptions] = useState(null);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, checkAuth, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites();
      loadPlaylists();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredFavorites(favorites);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await searchTracks(searchQuery);
        
        let searchResults = [];
        if (Array.isArray(result)) {
          searchResults = result;
        } else if (result?.payload && Array.isArray(result.payload)) {
          searchResults = result.payload;
        }
        
        const favoriteIds = new Set(favorites.map(track => String(track.id || track.ID)));
        

        const filteredResults = searchResults.filter(track => {
          const trackId = String(track.id || track.ID);
          return favoriteIds.has(trackId);
        });
        
        if (filteredResults.length === 0) {
          const localFiltered = favorites.filter(track => {
            const title = track.title || track.Title || '';
            const artist = track.artist || track.Artist || '';
            const album = track.album || track.Album || '';
            
            return (
              title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
              album.toLowerCase().includes(searchQuery.toLowerCase())
            );
          });
          setFilteredFavorites(localFiltered);
        } else {
          const enrichedResults = filteredResults.map(apiTrack => {
            const favoriteTrack = favorites.find(f => 
              String(f.id || f.ID) === String(apiTrack.id || apiTrack.ID)
            );
            return favoriteTrack || apiTrack;
          });
          
          setFilteredFavorites(enrichedResults);
        }
      } catch (error) {
        const localFiltered = favorites.filter(track => {
          const title = track.title || track.Title || '';
          const artist = track.artist || track.Artist || '';
          const album = track.album || track.Album || '';
          
          return (
            title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
            album.toLowerCase().includes(searchQuery.toLowerCase())
          );
        });
        setFilteredFavorites(localFiltered);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, favorites]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFavorites();
      let loadedFavorites = [];
      if (data && data.statusCode === 200 && Array.isArray(data.payload)) {
        loadedFavorites = data.payload;
      } else if (Array.isArray(data)) {
        loadedFavorites = data;
      }
      
      setFavorites(loadedFavorites);
      setFilteredFavorites(loadedFavorites);
    } catch (err) {
      if (err.message === 'UNAUTHORIZED' || err.statusCode === 401) {
        await checkAuth();
        setError('Сессия истекла. Пожалуйста, войдите снова.');
      } else {
        setError(err.message || 'Не удалось загрузить избранные треки');
      }
      setFavorites([]);
      setFilteredFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPlaylists = async () => {
    try {
      const data = await fetchPlaylists();
      if (data && data.statusCode === 200 && Array.isArray(data.payload)) {
        setPlaylists(data.payload);
      } else if (Array.isArray(data)) {
        setPlaylists(data);
      } else {
        setPlaylists([]);
      }
    } catch (err) {
      setPlaylists([]);
    }
  };
  
  const toggleSearch = () => {
    setShowSearch(prev => !prev);
  };

  const toggleTrackOptions = (trackId, e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowPlaylistDropdown(null);
    if (showOptions === trackId) {
      setShowOptions(null);
    } else {
      setShowOptions(trackId);
    }
  };

  const handleAddToPlaylist = (trackId, e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowOptions(null);
    if (showPlaylistDropdown === trackId) {
      setShowPlaylistDropdown(null);
    } else {
      setShowPlaylistDropdown(trackId);
    }
  };

  const handleCreatePlaylist = async (trackId) => {
    const playlistName = prompt('Введите название нового плейлиста:');
    if (!playlistName) return; 

    try {
      const result = await createPlaylist(playlistName);
      
      if (result && result.success) {
        const newPlaylistId = result.payload.ID || result.payload.id;
        
        loadPlaylists();
        
        if (trackId) {
          const currentTrack = favorites.find(t => (t.id || t.ID) === trackId);
          if (currentTrack) {
            const trackInfo = {
              id: trackId,
              title: currentTrack.title || currentTrack.Title,
              artist: currentTrack.artist || currentTrack.Artist,
              album: currentTrack.album || currentTrack.Album,
              duration: currentTrack.duration || currentTrack.Duration,
              albumUrlImage: currentTrack.albumUrlImage || currentTrack.AlbumUrlImage
            };
            
            await addTrackToPlaylist(newPlaylistId, trackId, trackInfo);
          }
        }
      }
    } catch (err) {
    } finally {
      setShowPlaylistDropdown(null);
      setShowOptions(null);
    }
  };

  const handleAddToSpecificPlaylist = async (trackId, playlistId, trackData) => {
    try {
      const currentTrack = favorites.find(t => (t.id || t.ID) === trackId);
      if (!currentTrack) {
        throw new Error('Трек не найден');
      }
      
      const trackInfo = {
        id: trackId,
        title: currentTrack.title || currentTrack.Title,
        artist: currentTrack.artist || currentTrack.Artist,
        album: currentTrack.album || currentTrack.Album,
        duration: currentTrack.duration || currentTrack.Duration,
        albumUrlImage: currentTrack.albumUrlImage || currentTrack.AlbumUrlImage
      };
      
      const result = await addTrackToPlaylist(playlistId, trackId, trackInfo);
    } catch (err) {
    } finally {
      setShowPlaylistDropdown(null);
      setShowOptions(null);
    }
  };

  const handleRemoveFromFavorites = async (trackId) => {
    try {
      await removeFromFavorites(trackId);

      setFavorites(favorites.filter(track => track.id !== trackId));
    } catch (err) {

    } finally {
      setShowOptions(null); 
    }
  };



  const processPlaylists = () => {
    if (playlists.length > 0) {
      return playlists.map(playlist => {
        const playlistId = playlist.ID || playlist.id;
        return {
          ...playlist,

          uniqueKey: playlistId ? `real-${playlistId}` : `playlist-${Math.random().toString(36).substr(2, 9)}`
        };
      });
    } else {
      return [];
    }
  };

  const displayPlaylists = processPlaylists();

  const handleClose = () => {
    setShowOptions(null);
    setShowPlaylistDropdown(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      const trackActions = document.querySelectorAll('.track-actions');
      let clickedInsideTrackActions = false;
      
      trackActions.forEach(trackAction => {
        if (trackAction.contains(e.target)) {
          clickedInsideTrackActions = true;
        }
      });
      
      if (!clickedInsideTrackActions) {
        setShowOptions(null);
        setShowPlaylistDropdown(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);


  const handlePlayTrack = (track) => {
    setCurrentTrack(track);
  };

  const handleTrackChange = (direction) => {
    if (!currentTrack || filteredFavorites.length === 0) return;
    
    const currentIndex = filteredFavorites.findIndex(track => track.id === currentTrack.id || track.ID === currentTrack.ID);
    if (currentIndex === -1) return;
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % filteredFavorites.length;
    } else {
      nextIndex = (currentIndex - 1 + filteredFavorites.length) % filteredFavorites.length;
    }
    
    setCurrentTrack(filteredFavorites[nextIndex]);
  };

  const handleToggleMenu = (e) => {
    if (e) e.stopPropagation();
    setMenuOpen(prev => !prev);
  };

  const handleLoginLogout = () => {
    if (isAuthenticated) {
      logout();
    } else {
      navigate('/?login=true');
    }
  };

  if (!isAuthenticated) {
  return (
      <div className="page-container">
      <Spots />
      
        <button className="menu-button" onClick={handleToggleMenu}>
          ☰
        </button>
        
        <button className="search-button" onClick={toggleSearch}>
            Поиск
          </button>
        
        <button className="login-button" onClick={handleLoginLogout}>
            {isAuthenticated ? 'Выход' : 'Вход'}
          </button>

        <h2 className="page-title">Избранное</h2>
        <AuthMessage />
        
        <Menu isOpen={menuOpen} />
      </div>
    );
  }

  return (
    <div className="page-container" onClick={() => {
      setShowOptions(null);
      setShowPlaylistDropdown(null);
      menuOpen && setMenuOpen(false);
    }}>
      <Spots />
      
      <button 
        className="menu-button" 
        onClick={handleToggleMenu}
      >
        ☰
      </button>
      
      <button className="search-button" onClick={toggleSearch}>
        Поиск
      </button>
      
      <button className="login-button" onClick={handleLoginLogout}>
        {isAuthenticated ? 'Выход' : 'Вход'}
      </button>
      
      <h2 className="page-title">Избранное</h2>
      
      <div className={`search-container ${showSearch ? 'active' : 'hidden'}`}>
        <input
          type="text"
          placeholder="Поиск..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="content-wrapper">
        {error ? (
          <div className="error-message">{error}</div>
        ) : loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <span>Загрузка избранного...</span>
          </div>
        ) : searching ? (
          <div className="loading">
            <div className="spinner"></div>
            <span>Поиск треков...</span>
          </div>
        ) : filteredFavorites.length > 0 ? (
                <div className="tracks-list">
            {filteredFavorites.map((track, index) => (
                    <div 
                      key={track.id || track.ID || index} 
                      className={`track-item ${currentTrack?.id === track.id || currentTrack?.ID === track.ID ? 'playing' : ''}`} 
                      onClick={(e) => e.stopPropagation()}
                    >
                                    <div className="track-main-info">
                <button 
                  className="track-play-button" 
                  onClick={() => handlePlayTrack(track)}
                >
                  {currentTrack?.id === track.id || currentTrack?.ID === track.ID ? '⏸' : '▶'}
                </button>
                  <div className="track-details">
                    <div className="track-title">{track.title || track.Title || `Трек ${index + 1}`}</div>
                    <div className="track-artist">{track.artist || track.Artist || 'Неизвестный исполнитель'}</div>
                  </div>
              </div>
                      
                      <div className="track-actions">
                        <button 
                          className="track-action-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTrackOptions(track.id || track.ID, e);
                          }}
                          title="Меню"
                        >
                    ⋮
                        </button>
                        
                        {showOptions === (track.id || track.ID) && (
                          <div className="track-menu" onClick={(e) => e.stopPropagation()}>
                            <div 
                              className="track-menu-item"
                              onClick={(e) => handleAddToPlaylist(track.id || track.ID, e)}
                            >
                              Добавить в плейлист
                            </div>
                            <div 
                              className="track-menu-item" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromFavorites(track.id || track.ID);
                              }}
                            >
                              Удалить из избранного
                            </div>
                          </div>
                        )}

                        {showPlaylistDropdown === (track.id || track.ID) && (
                          <div className="playlists-dropdown" onClick={(e) => e.stopPropagation()}>
                            <div className="playlists-dropdown-header">
                              Выберите плейлист
                            </div>
                            <div 
                              className="playlist-item create-new"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreatePlaylist(track.id || track.ID);
                              }}
                            >
                              + Создать новый плейлист
                            </div>
                            {displayPlaylists.length > 0 ? (
                              displayPlaylists.map(playlist => (
                                <div 
                                  key={playlist.uniqueKey}
                                  className="playlist-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToSpecificPlaylist(
                                      track.id || track.ID, 
                                      playlist.ID || playlist.id
                                    );
                                  }}
                                >
                                  {playlist.Title || playlist.title || "Плейлист"}
                                </div>
                              ))
                            ) : (
                              <div className="playlist-item disabled">
                                Нет доступных плейлистов
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
        ) : searchQuery ? (
          <div className="no-results">
            Ничего не найдено по запросу "{searchQuery}"
                </div>
            ) : (
          <div className="no-favorites">
            Ваш список избранного пуст
              </div>
        )}
      </div>
      
      {currentTrack && (
      <Player 
        currentTrack={currentTrack} 
        onTrackChange={handleTrackChange} 
      />
      )}
      
      <Menu isOpen={menuOpen} />
    </div>
  );
};

export default MyMusic;