import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PlaylistDetailPage.css';
import '../common.css';
import { useAuth } from '../../AuthContext/AuthContext';
import Player from '../Player/Player';
import Spots from '../Spots/Spots';
import Menu from '../Menu/Menu';
import AuthMessage from '../AuthMessage/AuthMessage';
import { 
  fetchPlaylists, 
  fetchPlaylistTracks, 
  addTrackToPlaylist, 
  removeTrackFromPlaylist,
  deletePlaylist
} from '../Api/apiService';

const PlaylistSelector = ({ 
  isOpen, 
  onClose, 
  trackId, 
  otherPlaylists, 
  navigate, 
  handleAddToPlaylist 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="playlist-selector-modal" onClick={onClose}>
      <div className="playlist-selector-content" onClick={e => e.stopPropagation()}>
        <h3>Выберите плейлист</h3>
        {otherPlaylists.length === 0 ? (
          <div className="empty-playlists-message">
            У вас нет других плейлистов
            <button 
              className="create-playlist-button" 
              onClick={() => navigate('/playlists')}
            >
              Создать плейлист
            </button>
          </div>
        ) : (
          <div className="playlists-list">
            {otherPlaylists.map(playlist => (
              <div 
                key={playlist.id || playlist.ID}
                className="playlist-item"
                onClick={() => {
                  handleAddToPlaylist(trackId, playlist.id || playlist.ID);
                  onClose();
                }}
              >
                {playlist.title || playlist.Title || "Плейлист"}
              </div>
            ))}
          </div>
        )}
        <button className="close-button" onClick={onClose}>Закрыть</button>
      </div>
    </div>
  );
};

const PlaylistDetailPage = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTrackMenu, setActiveTrackMenu] = useState(null);
  const [activePlaylistSubmenu, setActivePlaylistSubmenu] = useState(null);
  const [allPlaylists, setAllPlaylists] = useState([]);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const loadPlaylistData = async () => {
      setLoading(true);
      try {
        const playlistsResponse = await fetchPlaylists();
      
        let playlistsArray = [];
        if (Array.isArray(playlistsResponse)) {
          playlistsArray = playlistsResponse;
        } else if (playlistsResponse && Array.isArray(playlistsResponse.playlists)) {
          playlistsArray = playlistsResponse.playlists;
        } else if (playlistsResponse && playlistsResponse.payload && Array.isArray(playlistsResponse.payload)) {
          playlistsArray = playlistsResponse.payload;
        } else {
          playlistsArray = [];
        }
        
        setAllPlaylists(playlistsArray);
        
        if (!playlistId) {
          setError('ID плейлиста не указан');
          setLoading(false);
          return;
        }
        
        const foundPlaylist = playlistsArray.find(p => 
          String(p.id || p.ID) === String(playlistId)
        );
        
        if (!foundPlaylist) {
          setError('Плейлист не найден');
          setLoading(false);
          return;
        }
        
        setPlaylist(foundPlaylist);
        
        const trackData = await fetchPlaylistTracks(playlistId);
        
        let tracksArray = [];
        if (Array.isArray(trackData)) {
          tracksArray = trackData;
        } else if (trackData && Array.isArray(trackData.tracks)) {
          tracksArray = trackData.tracks;
        } else if (trackData && trackData.payload && Array.isArray(trackData.payload)) {
          tracksArray = trackData.payload;
        } else {
          tracksArray = [];
        }
              
        setTracks(tracksArray);
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить плейлист');
        setTracks([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadPlaylistData();
  }, [playlistId, navigate]);

  const handlePlayTrack = (track) => {
    setCurrentTrack(track);
  };

  const handleRemoveTrack = async (trackId) => {
    if (!trackId) return;
    
    try {
      await removeTrackFromPlaylist(playlistId, trackId);
      
      const updatedTracks = tracks.filter(track => 
        String(track.id || track.ID) !== String(trackId)
      );
      setTracks(updatedTracks);
      
      if (currentTrack && (String(currentTrack.id || currentTrack.ID) === String(trackId))) {
        setCurrentTrack(null);
      }
      
      setActiveTrackMenu(null);
      setError(null);
    } catch (err) {
      setError('Не удалось удалить трек');
    }
  };


  const handleAddToPlaylist = (trackId, targetPlaylistId) => {
    if (!trackId || !targetPlaylistId) {
      return;
    }
    

    if (String(targetPlaylistId) === String(playlistId)) {
      return;
    }
    
    addTrackToPlaylist(targetPlaylistId, trackId)
      .then(() => {

        const targetPlaylist = allPlaylists.find(p => 
          String(p.id || p.ID) === String(targetPlaylistId)
        );
      })
      .catch(() => {
      });
  };

  const handleGoToAlbum = (trackId) => {

    setActiveTrackMenu(null);
  };

  const handleTrackChange = (direction) => {
    if (!currentTrack || !Array.isArray(tracks) || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(track => 
      String(track.id || track.ID) === String(currentTrack.id || currentTrack.ID)
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

  const handleBack = () => {
    navigate('/playlists');
  };

  const handleDeletePlaylist = async () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
  
    if (!playlistId) {
      return;
    }
    
    if (window.confirm(`Вы уверены, что хотите удалить плейлист "${playlist.title || playlist.Title || 'Плейлист'}"?`)) {
      try {
        await deletePlaylist(playlistId);
        navigate('/playlists');
      } catch (err) {
        if (window.confirm('API не поддерживает удаление плейлистов. Хотите вернуться к списку плейлистов?')) {
          navigate('/playlists');
        }
      }
    }
  };

  const handleLoginLogout = () => {
    if (isAuthenticated) {
      logout();
    } else {
      navigate('/?login=true');
    }
  };

  const toggleMenu = (e) => {
    if (e) e.stopPropagation();
    setMenuOpen(prev => !prev);
  };

  const toggleSearch = () => {
    setShowSearch(prev => !prev);
  };

  const toggleTrackMenu = (trackId, e) => {
    e.stopPropagation();
    
    if (activeTrackMenu === trackId) {
      setActiveTrackMenu(null);
    } else {
      setActiveTrackMenu(trackId);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.track-menu') && 
          !e.target.closest('.track-action-button')) {
        setActiveTrackMenu(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setActiveTrackMenu(null);
        setActivePlaylistSubmenu(null);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const otherPlaylists = useMemo(() => {
    return Array.isArray(allPlaylists)
      ? allPlaylists.filter(p => String(p.id || p.ID) !== String(playlistId))
      : [];
  }, [allPlaylists, playlistId]);

  const openPlaylistSelector = (trackId) => {
    setSelectedTrackId(trackId);
    setShowPlaylistSelector(true);
    setActiveTrackMenu(null);
  };

  const closePlaylistSelector = () => {
    setShowPlaylistSelector(false);
  };

  const openLogin = () => {
    navigate('/?login=true');
  };

  const filteredTracks = useMemo(() => {
    return tracks.filter(track => {
      const title = (track.title || track.Title || '').toLowerCase();
      const artist = (track.artist || track.Artist || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return title.includes(query) || artist.includes(query);
    });
  }, [tracks, searchQuery]);

  if (!isAuthenticated) {
    return (
      <div className="page-container">
        <Spots />

        <button className="menu-button" onClick={toggleMenu}>
          ☰
        </button>
        
        <button className="search-button" onClick={toggleSearch}>
          Поиск
        </button>
        
        <button className="login-button" onClick={handleLoginLogout}>
          {isAuthenticated ? 'Выход' : 'Вход'}
        </button>

        <h2 className="page-title">Плейлист</h2>
        <AuthMessage />
        
        <Menu isOpen={menuOpen} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <Spots />
        <button className="menu-button" onClick={toggleMenu}>
          ☰
        </button>
        
        <button className="search-button" onClick={toggleSearch}>
          Поиск
        </button>
        
        <button className="login-button" onClick={handleLoginLogout}>
          {isAuthenticated ? 'Выход' : 'Вход'}
        </button>
        <div className="loading">
          <div className="spinner"></div>
          <span>Загрузка...</span>
        </div>
        <Menu isOpen={menuOpen} />
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="page-container">
        <Spots />
        <button className="menu-button" onClick={toggleMenu}>
          ☰
        </button>
        
        <button className="search-button" onClick={toggleSearch}>
          Поиск
        </button>
        
        <button className="login-button" onClick={handleLoginLogout}>
          {isAuthenticated ? 'Выход' : 'Вход'}
        </button>
        <div className="content-wrapper">
          <div className="error-message">
            {error || 'Плейлист не найден'}
            <button 
              className="back-button-inline"
              onClick={handleBack}
            >
              Вернуться назад
            </button>
          </div>
        </div>
        <Menu isOpen={menuOpen} />
      </div>
    );
  }

  return (
    <div className="page-container" onClick={() => {
      setActiveTrackMenu(null);
      setActivePlaylistSubmenu(null);
      menuOpen && setMenuOpen(false);
    }}>
      <Spots />
      
      <button 
        className="menu-button" 
        onClick={toggleMenu}
      >
        ☰
      </button>
      
      <button className="search-button" onClick={toggleSearch}>
        Поиск
      </button>
      
      <button className="login-button" onClick={handleLoginLogout}>
        {isAuthenticated ? 'Выход' : 'Вход'}
      </button>
      
      <h2 className="page-title">Плейлист</h2>
      
      <div className={`search-container ${showSearch ? 'active' : 'hidden'}`}>
        <input
          type="text"
          placeholder="Поиск треков..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="content-wrapper">
        <div className="playlist-info">
          <div className="item-cover">
            <div className="item-placeholder">♪</div>
          </div>
          <div className="playlist-details">
            <h2 className="playlist-title">
              {playlist.title || playlist.Title || 'Плейлист'}
            </h2>
            <div className="playlist-actions">
              <button 
                className="delete-playlist-btn"
                onClick={handleDeletePlaylist}
                title="Удалить плейлист"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
        
        {tracks.length > 0 ? (
          <div className="tracks-list">
            {filteredTracks.map((track) => (
              <div 
                key={track.id || track.ID} 
                className="track-item"
                onClick={() => handlePlayTrack(track)}
              >
                <div className="track-main-info">
                  <button className="track-play-button">
                    {currentTrack && (currentTrack.id === track.id || currentTrack.ID === track.ID) ? '❙❙' : '▶'}
                  </button>
                  <div className="track-details">
                    <div className="track-title">{track.title || track.Title || 'Без названия'}</div>
                    <div className="track-artist">{track.artist || track.Artist || 'Неизвестный исполнитель'}</div>
                  </div>
                </div>
                <div className="track-actions">
                  <button 
                    className="track-action-button"
                    onClick={(e) => toggleTrackMenu(track.id || track.ID, e)}
                  >
                    ⋮
                  </button>
                  
                  {activeTrackMenu === (track.id || track.ID) && (
                    <div className="track-menu-container">
                      <div className="track-menu">
                        <div 
                          className="track-menu-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTrack(track.id || track.ID);
                          }}
                        >
                          Удалить из плейлиста
                        </div>
                        <div 
                          className="track-menu-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPlaylistSelector(track.id || track.ID);
                          }}
                        >
                          Добавить в плейлист
                        </div>
                        <div 
                          className="track-menu-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGoToAlbum(track.id || track.ID);
                          }}
                        >
                          Перейти к альбому
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-tracks-message">
            В этом плейлисте нет треков
          </div>
        )}
      </div>
      
      <Menu isOpen={menuOpen} />
      
      <PlaylistSelector 
        isOpen={showPlaylistSelector}
        onClose={closePlaylistSelector}
        trackId={selectedTrackId}
        otherPlaylists={otherPlaylists}
        navigate={navigate}
        handleAddToPlaylist={handleAddToPlaylist}
      />
      
      {currentTrack && (
        <Player 
          currentTrack={currentTrack} 
          onTrackChange={handleTrackChange}
        />
      )}
    </div>
  );
};

export default PlaylistDetailPage; 