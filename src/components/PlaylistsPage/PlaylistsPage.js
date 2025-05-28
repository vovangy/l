import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PlaylistsPage.css';
import '../common.css';
import { useAuth } from '../../AuthContext/AuthContext';
import Menu from '../Menu/Menu';
import Spots from '../Spots/Spots';
import AuthMessage from '../AuthMessage/AuthMessage';
import { fetchPlaylists, createPlaylist } from '../Api/apiService';

const PlaylistsPage = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { isAuthenticated, logout } = useAuth();


  useEffect(() => {
    const loadPlaylists = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const playlistsResponse = await fetchPlaylists();

        if (Array.isArray(playlistsResponse)) {
          setPlaylists(playlistsResponse);
        } else if (playlistsResponse && Array.isArray(playlistsResponse.playlists)) {

          setPlaylists(playlistsResponse.playlists);
        } else if (playlistsResponse && playlistsResponse.payload && Array.isArray(playlistsResponse.payload)) {

          setPlaylists(playlistsResponse.payload);
        } else {
 
          setPlaylists([]);
        }
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить плейлисты');
        setPlaylists([]);
      } finally {
        setLoading(false);
      }
    };

    loadPlaylists();
  }, [isAuthenticated]);


  const filteredPlaylists = playlists.filter(playlist => {
    const title = (playlist.title || playlist.Title || '').toLowerCase();
    return title.includes(searchQuery.toLowerCase());
  });


  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    
    if (!newPlaylistName.trim()) return;
    
    if (!isAuthenticated) {
      navigate('/?login=true');
      return;
    }
    
    try {
      const response = await createPlaylist(newPlaylistName.trim());
      
      let newPlaylist = null;
      if (response && typeof response === 'object') {
        if (response.id || response.ID) {
         
          newPlaylist = response;
        } else if (response.playlist) {

          newPlaylist = response.playlist;
        } else if (response.payload && typeof response.payload === 'object') {

          newPlaylist = response.payload;
        }
      }
      
      setPlaylists(prevPlaylists => {
        const prevArray = Array.isArray(prevPlaylists) ? prevPlaylists : [];
        
        if (newPlaylist) {
          return [...prevArray, newPlaylist];
        }
        return prevArray;
      });
      
      setNewPlaylistName('');
      setShowCreateForm(false);
      setError(null);
    } catch (err) {
      setError('Не удалось создать плейлист');
    }
  };

  const handlePlaylistClick = (playlistId) => {
    navigate(`/playlist/${playlistId}`);
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

  return (
    <div className="page-container" onClick={() => menuOpen && setMenuOpen(false)}>
      <Spots />
      
      <button 
        className="menu-button" 
        onClick={toggleMenu}
        aria-label="Открыть меню"
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
      
      <div className="playlists-page-content">
        {!isAuthenticated ? (
          <AuthMessage />
        ) : loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Загружаем ваши плейлисты...</p>
          </div>
        ) : error ? (
          <div className="playlists-error">
            <p>{error}</p>
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Попробовать снова
            </button>
          </div>
        ) : (
          <>
            <div className="playlists-grid">
              {filteredPlaylists && filteredPlaylists.length > 0 ? (
                filteredPlaylists.map(playlist => (
                  <div 
                    key={playlist.id || playlist.ID} 
                    className="playlist-card"
                    onClick={() => handlePlaylistClick(playlist.id || playlist.ID)}
                  >
                    <div className="playlist-image"></div>
                    <div className="playlist-name">{playlist.title || playlist.Title}</div>
                  </div>
                ))
              ) : searchQuery ? (
                <div className="no-playlists">
                  <p>Ничего не найдено по запросу "{searchQuery}"</p>
                </div>
              ) : (
                <div className="no-playlists">
                  <p>У вас пока нет плейлистов</p>
                </div>
              )}
            </div>
            
            {showCreateForm ? (
              <form className="create-playlist-form" onSubmit={handleCreatePlaylist}>
                <input 
                  type="text" 
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Название плейлиста"
                  className="playlist-input"
                  autoFocus
                />
                <div className="form-buttons">
                  <button type="submit" className="create-button">Создать</button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              <button 
                className="create-playlist-button"
                onClick={() => setShowCreateForm(true)}
              >
                + Создать плейлист
              </button>
            )}
          </>
        )}
      </div>
      
      <Menu isOpen={menuOpen} />
    </div>
  );
};

export default PlaylistsPage; 