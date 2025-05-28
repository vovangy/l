import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPlaylists.css';
import '../common.css';
import Player from '../Player/Player';
import Spots from '../Spots/Spots';
import AuthMessage from '../AuthMessage/AuthMessage';
import { fetchPlaylists, deletePlaylist, searchPlaylists } from '../Api/apiService';
import { useAuth } from '../../AuthContext/AuthContext';
import Menu from '../Menu/Menu';

const MyPlaylists = ({ toggleMenu }) => {
  const [playlists, setPlaylists] = useState([]);
  const [filteredPlaylists, setFilteredPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTrack, setCurrentTrack] = useState(null);

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

  useEffect(() => {
    if (isAuthenticated) {
      const loadPlaylists = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchPlaylists();
          const loadedPlaylists = Array.isArray(data) ? data : [data];
          setPlaylists(loadedPlaylists);
          setFilteredPlaylists(loadedPlaylists);
        } catch (err) {
          setError(err.message);
          setPlaylists([]);
          setFilteredPlaylists([]);
        } finally {
          setLoading(false);
        }
      };
      loadPlaylists();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredPlaylists(playlists);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await searchPlaylists(searchQuery);
        
        if (result.success && Array.isArray(result.payload)) {
          setFilteredPlaylists(result.payload);
        } else {
          const filtered = playlists.filter(playlist => {
            const title = String(playlist.title || playlist.Title || '').toLowerCase();
            return title.includes(searchQuery.toLowerCase());
          });
          setFilteredPlaylists(filtered);
        }
      } catch (err) {
        const filtered = playlists.filter(playlist => {
          const title = String(playlist.title || playlist.Title || '').toLowerCase();
          return title.includes(searchQuery.toLowerCase());
        });
        setFilteredPlaylists(filtered);
      } finally {
        setSearching(false);
      }
    }, 500); 

    return () => clearTimeout(timeoutId);
  }, [searchQuery, playlists]);

  const handleToggleMenu = (e) => {
    if (e) e.stopPropagation();
    setMenuOpen(prev => !prev);
  };

  const toggleSearch = () => {
    setShowSearch(prev => !prev);
  };

  const handleLoginLogout = () => {
    if (isAuthenticated) {
      logout();
    } else {
      navigate('/?login=true');
    }
  };

  const handleRemovePlaylist = async (e, playlistId) => {
    e.stopPropagation();
    try {
      await deletePlaylist(playlistId);
      const updatedPlaylists = playlists.filter(playlist => 
        (playlist.ID || playlist.id) !== playlistId
      );
      setPlaylists(updatedPlaylists);
      setFilteredPlaylists(prev => 
        prev.filter(playlist => (playlist.ID || playlist.id) !== playlistId)
      );
    } catch (err) {
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

        <h2 className="page-title">Мои плейлисты</h2>
        <AuthMessage />
        
        <Menu isOpen={menuOpen} />
      </div>
    );
  }

  return (
    <div className="page-container" onClick={() => menuOpen && setMenuOpen(false)}>
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
      
      <h2 className="page-title">Мои плейлисты</h2>
      
      <div className={`search-container ${showSearch ? 'active' : 'hidden'}`}>
        <input
          type="text"
          placeholder="Поиск по названию..."
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
            <span>Загрузка...</span>
          </div>
        ) : searching ? (
          <div className="loading">
            <div className="spinner"></div>
            <span>Поиск плейлистов...</span>
          </div>
        ) : filteredPlaylists.length > 0 ? (
          <div className="albums-list">
            {filteredPlaylists.map((playlist, index) => (
              <div 
                key={playlist.id || playlist.ID || index} 
                className="item-row"
                onClick={() => {
                  const tracks = playlist.tracks || [];
                  if (tracks.length > 0) {
                    setCurrentTrack(tracks[0]);
                    setFilteredFavorites(tracks);
                  }
                  navigate(`/playlist/${playlist.id || playlist.ID}`);
                }}
              >
                <div className="item-main-info">
                  <div className="item-cover">
                    <div className="item-placeholder">♪</div>
                  </div>
                  <div className="item-titles">
                    <div className="item-title">{playlist.title || playlist.Title || `Плейлист ${index + 1}`}</div>
                    <div className="item-subtitle">{playlist.tracks?.length || 0} треков</div>
                  </div>
                </div>
                <button 
                  className="remove-album-button"
                  onClick={(e) => handleRemovePlaylist(e, playlist.id || playlist.ID)}
                  title="Удалить плейлист"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="no-results">
            Ничего не найдено по запросу "{searchQuery}"
          </div>
        ) : (
          <div className="no-results">Нет плейлистов</div>
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

export default MyPlaylists;