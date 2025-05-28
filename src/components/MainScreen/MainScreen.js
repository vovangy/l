import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainScreen.css';
import { fetchAlbums, searchAll, addToFavorites, fetchPlaylists, addTrackToPlaylist, createPlaylist } from '../Api/apiService.js';
import { useAuth } from '../../AuthContext/AuthContext.js';
import Player from '../Player/Player';

const MainScreen = ({ menuOpen, toggleMenu, openLogin, children}) => {
  const [albums, setAlbums] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState(null);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('albums'); 
  const [activeTrackMenu, setActiveTrackMenu] = useState(null);
  const [activePlaylistMenu, setActivePlaylistMenu] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadAlbums = async () => {
      try {
        const data = await fetchAlbums();
        const albumsData = Array.isArray(data.payload) ? data.payload : [];
        setAlbums(albumsData);
      } catch (err) {
        setError("Не удалось загрузить альбомы");
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlbums();
    
    if (isAuthenticated) {
      loadPlaylists();
    }
  }, [isAuthenticated]);
  
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

  useEffect(() => {
    if (!searchQuery) {
      const loadAlbums = async () => {
        setSearching(true);
        try {
          const data = await fetchAlbums();
          const albumsData = Array.isArray(data.payload) ? data.payload : [];
          setAlbums(albumsData);
          setTracks([]);
        } catch (err) {
          setError("Не удалось загрузить альбомы");
          setAlbums([]);
        } finally {
          setSearching(false);
        }
      };

      loadAlbums();
      return;
    }

    const timeoutId = setTimeout(() => {
      const searchAllAPI = async () => {
        setSearching(true);
        try {
          const data = await searchAll(searchQuery);
        
          if (data && data.albums) {
            setAlbums(Array.isArray(data.albums) ? data.albums : []);
          } else {
            setAlbums([]);
          }
          if (data && data.tracks) {
            setTracks(Array.isArray(data.tracks) ? data.tracks : []);
          } else {
            setTracks([]);
          }
          
          setError(null);
        } catch (err) {
          setError("Ошибка при поиске");
          setAlbums([]);
          setTracks([]);
        } finally {
          setSearching(false);
        }
      };

      searchAllAPI();
    }, 500); // Задержка 500мс для предотвращения частых запросов при вводе
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const spots = document.querySelectorAll('.spot');

      spots.forEach((spot) => {
        const speed = spot.dataset.speed || 0;
        const offset = scrollPosition * speed;
        spot.style.transform = `translateY(${offset}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAlbumClick = (albumId) => {
    navigate(`/album/${albumId}`);
  };
  
  const toggleSearch = () => {
    setShowSearch(prev => !prev);
  };
  
  const handlePlayTrack = (track) => {
    setCurrentTrack(track);
    // Здесь можно добавить логику воспроизведения трека
  };
  
  const handleTrackChange = (direction) => {
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(track => 
      (track.ID || track.id) === (currentTrack.ID || currentTrack.id)
    );
    
    if (currentIndex === -1) return;
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % tracks.length;
    } else {
      nextIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    }
    
    setCurrentTrack(tracks[nextIndex]);
  };
  
  const handleAddToFavorites = async (track) => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    try {
      const trackData = {
        id: track.ID || track.id,
        title: track.Title || track.title,
        album: track.Album || track.album,
        albumId: track.albumId || track.album_id || track.AlbumId || track.AlbumID,
        artist: track.Artist || track.artist,
        duration: track.Duration || track.duration || "0:00",
        albumUrlImage: track.albumUrlImage || track.AlbumUrlImage
      };
      
      await addToFavorites(track.ID || track.id, trackData);
    } catch (error) {
    }
  };
  
  const toggleTrackMenu = (trackId) => {
    setActivePlaylistMenu(null);
    
    if (activeTrackMenu === trackId) {
      setActiveTrackMenu(null);
    } else {
      setActiveTrackMenu(trackId);
    }
  };

  const togglePlaylistMenu = (trackId, e) => {
    e.stopPropagation();
    setActiveTrackMenu(null);
    
    if (activePlaylistMenu === trackId) {
      setActivePlaylistMenu(null);
    } else {
      setActivePlaylistMenu(trackId);
    }
  };
  
  const handleAddToPlaylist = async (trackId, playlistId) => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    try {
      const track = tracks.find(t => (t.ID || t.id) === trackId);
      if (!track) return;
      const trackData = {
        id: track.ID || track.id,
        title: track.Title || track.title,
        album: track.Album || track.album,
        artist: track.Artist || track.artist,
        duration: track.Duration || track.duration || "0:00",
        albumUrlImage: track.albumUrlImage || track.AlbumUrlImage
      };
      
      await addTrackToPlaylist(playlistId, trackId, trackData);
      setActivePlaylistMenu(null);
    } catch (error) {
    }
  };

  const handleCreatePlaylist = async (trackId) => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    
    const playlistName = prompt('Введите название нового плейлиста:');
    if (!playlistName) return; 

    try {
      const result = await createPlaylist(playlistName);
      
      if (result && result.success) {
        const newPlaylistId = result.payload.ID || result.payload.id;
        
        loadPlaylists();
        

        if (trackId) {
          const currentTrack = tracks.find(t => (t.id || t.ID) === trackId);
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
      setActivePlaylistMenu(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      const trackMenus = document.querySelectorAll('.track-menu-container');
      let clickedInsideMenu = false;
      
      trackMenus.forEach(menu => {
        if (menu && menu.contains(e.target)) {
          clickedInsideMenu = true;
        }
      });
      
      if (!clickedInsideMenu) {
        setActiveTrackMenu(null);
        setActivePlaylistMenu(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  const renderSearchResults = () => {
    if (loading || searching) {
      return (
        <div className="loading">
          <div className="spinner"></div>
          {searching ? 'Поиск...' : 'Загрузка...'}
        </div>
      );
    }
    
    if (error) {
      return <div className="error-message">{error}</div>;
    }
    
    if (searchQuery) {
      return (
        <div className="search-results">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'albums' ? 'active' : ''}`}
              onClick={() => setActiveTab('albums')}
            >
              Альбомы ({albums.length})
            </button>
            <button 
              className={`tab ${activeTab === 'tracks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tracks')}
            >
              Треки ({tracks.length})
            </button>
          </div>
          
          {activeTab === 'albums' ? (
            albums.length > 0 ? (
              <div className="albums-list">
                {albums.map((album) => (
                  <div 
                    key={album.ID} 
                    className="album-row"
                    onClick={() => handleAlbumClick(album.ID)} 
                    style={{cursor: 'pointer'}}
                  >
                    <div className="album-main-info">
                      <img
                        src={album.UrlImage}
                        alt={`Обложка: ${album.Title}`}
                        className="album-cover"
                        onError={(e) => {
                          e.target.src = '/assets/album-placeholder.jpg';
                        }}
                      />
                      <div className="album-titles">
                        <h3 className="album-title">{album.Title}</h3>
                        {album.ArtistName && <p className="album-artist">{album.ArtistName}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results">
                Ничего не найдено по запросу "{searchQuery}"
              </div>
            )
          ) : (
            tracks.length > 0 ? (
              <div className="tracks-list">
                {tracks.map((track, index) => (
                  <div 
                    key={track.ID || track.id || index} 
                    className={`track-item ${currentTrack?.ID === track.ID ? 'playing' : ''}`}
                  >
                    <div className="track-main-info">
                      <button 
                        className="track-play-button" 
                        onClick={() => handlePlayTrack(track)}
                      >
                        {currentTrack?.ID === track.ID ? '⏸' : '▶'}
                      </button>
                      <span className="track-title">
                        {track.Title || track.title || `Трек ${index + 1}`}
                      </span>
                      <span className="track-artist">
                        {track.Artist || track.artist || 'Неизвестный исполнитель'}
                      </span>
                    </div>
                    
                    <div className="track-actions">
                      <button 
                        className="track-action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTrackMenu(track.ID || track.id);
                        }}
                        title="Меню"
                      >
                        ⋯
                      </button>
                      
                      {activeTrackMenu === (track.ID || track.id) && (
                        <div className="track-menu track-menu-container" onClick={e => e.stopPropagation()}>
                          <div 
                            className="track-menu-item"
                            onClick={() => handleAddToFavorites(track)}
                          >
                            Добавить в мою музыку
                          </div>
                          <div 
                            className="track-menu-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePlaylistMenu(track.ID || track.id, e);
                            }}
                          >
                            Добавить в плейлист
                          </div>
                        </div>
                      )}
                      
                      {activePlaylistMenu === (track.ID || track.id) && (
                        <div className="playlists-dropdown track-menu-container" onClick={e => e.stopPropagation()}>
                          <div className="playlists-dropdown-header">
                            Выберите плейлист
                          </div>
                          <div 
                            className="playlist-item create-new"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreatePlaylist(track.ID || track.id);
                            }}
                          >
                            + Создать новый плейлист
                          </div>
                          {playlists.length > 0 ? (
                            playlists.map(playlist => {
                            
                              const playlistId = playlist.ID || playlist.id;
                              const uniqueKey = playlistId ? 
                                `playlist-${playlistId}-${track.ID || track.id}` : 
                                `playlist-item-${Math.random().toString(36).substr(2, 9)}`;
                              
                              return (
                                <div 
                                  key={uniqueKey} 
                                  className="playlist-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToPlaylist(track.ID || track.id, playlistId);
                                  }}
                                >
                                  {playlist.Title || playlist.title || "Плейлист"}
                                </div>
                              );
                            })
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
            ) : (
              <div className="no-results">
                Ничего не найдено по запросу "{searchQuery}"
              </div>
            )
          )}
        </div>
      );
    }
    

    return albums.length > 0 ? (
        <div className="albums-list">
          {albums.map((album) => (
            <div 
              key={album.ID} 
              className="album-row"
              onClick={() => handleAlbumClick(album.ID)} 
              style={{cursor: 'pointer'}}
            >
              <div className="album-main-info">
                <img
                  src={album.UrlImage}
                  alt={`Обложка: ${album.Title}`}
                  className="album-cover"
                  onError={(e) => {
                    e.target.src = '/assets/album-placeholder.jpg';
                  }}
                />
                <div className="album-titles">
                  <h3 className="album-title">{album.Title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
          <div className="no-results">
            {searchQuery ? `Ничего не найдено по запросу "${searchQuery}"` : 'Нет доступных альбомов'}
          </div>
    );
  };

  return (
    <div className="main-screen">
      {children}
      
      <button className="search-button" onClick={toggleSearch}>
        Поиск
      </button>
      
      <button className="login-button" onClick={isAuthenticated ? logout : openLogin}>
        {isAuthenticated ? 'Выход' : 'Вход'}
      </button>

      <div className={`search-container ${showSearch ? 'active' : 'hidden'}`}>
        <input
          type="text"
          placeholder="Поиск альбомов и треков..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <h2 className="main-title">
        {searchQuery ? 'Результаты поиска' : 'Топ-100 альбомов'}
      </h2>
      
      <button className="menu-button" onClick={(e) => {
        e.stopPropagation();
        toggleMenu();
      }} aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}>
        ☰
      </button>

      <div className="content">
        {renderSearchResults()}
      </div>
      
      {/* Добавляем проигрыватель */}
      <Player 
        currentTrack={currentTrack} 
        onTrackChange={handleTrackChange} 
      />
    </div>
  );
};

export default MainScreen;