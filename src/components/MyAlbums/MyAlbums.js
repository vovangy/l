import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyAlbums.css';
import '../common.css';
import Spots from '../Spots/Spots';
import { useAuth } from '../../AuthContext/AuthContext';
import { fetchFavoriteAlbums, removeAlbumFromFavorites } from '../Api/apiService';
import Menu from '../Menu/Menu';
import AuthMessage from '../AuthMessage/AuthMessage';

const MyAlbums = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      loadFavoriteAlbums();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadFavoriteAlbums = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFavoriteAlbums();
      if (data && data.statusCode === 200 && Array.isArray(data.payload)) {
        setAlbums(data.payload);
      } else if (Array.isArray(data)) {
        setAlbums(data);
      } else {
        setAlbums(demoAlbums);
      }
    } catch (err) {
      setAlbums(demoAlbums);
      setError('Не удалось загрузить избранные альбомы');
    } finally {
      setLoading(false);
    }
  };


  const demoAlbums = [
    { ID: 'demo1', Title: 'The Dark Side of the Moon', ArtistName: 'Pink Floyd', UrlImage: null },
    { ID: 'demo2', Title: 'Thriller', ArtistName: 'Michael Jackson', UrlImage: null },
    { ID: 'demo3', Title: 'Back in Black', ArtistName: 'AC/DC', UrlImage: null },
    { ID: 'demo4', Title: 'Abbey Road', ArtistName: 'The Beatles', UrlImage: null },
  ];

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

  const handleAlbumClick = (albumId) => {
    navigate(`/album/${albumId}`);
  };

  const handleRemoveAlbum = async (e, albumId) => {
    e.stopPropagation();
    try {
      await removeAlbumFromFavorites(albumId);
      setAlbums(albums.filter(album => (album.ID || album.id) !== albumId));
    } catch (err) {
    }
  };



  const filteredAlbums = albums.filter(album => {
    const title = (album.Title || album.title || '').toLowerCase();
    const artist = (album.ArtistName || album.artist || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query) || artist.includes(query);
  });

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

        <h2 className="page-title">Мои альбомы</h2>
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
      
      <h2 className="page-title">Мои альбомы</h2>
      
      <div className={`search-container ${showSearch ? 'active' : 'hidden'}`}>
        <input
          type="text"
          placeholder="Поиск по названию или исполнителю..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="content-wrapper">
        {error && !filteredAlbums.length ? (
          <div className="error-message">{error}</div>
        ) : loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <span>Загрузка...</span>
          </div>
        ) : filteredAlbums.length > 0 ? (
          <div className="albums-list">
            {filteredAlbums.map((album) => (
              <div 
                key={album.ID || album.id} 
                className="item-row"
                onClick={() => handleAlbumClick(album.ID || album.id)}
              >
                <div className="item-main-info">
                  <div className="item-cover">
                  {album.UrlImage ? (
                    <img 
                      src={album.UrlImage || album.urlImage} 
                      alt={`Обложка альбома ${album.Title || album.title}`} 
                    />
                  ) : (
                      <div className="item-placeholder">♪</div>
                  )}
                  </div>
                  <div className="item-titles">
                    <div className="item-title">{album.Title || album.title}</div>
                    <div className="item-subtitle">{album.ArtistName || album.artist}</div>
                  </div>
                </div>
                  <button 
                    className="remove-album-button"
                    onClick={(e) => handleRemoveAlbum(e, album.ID || album.id)}
                    title="Удалить из избранных"
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
          <div className="no-results">Нет избранных альбомов</div>
        )}
      </div>
      
      <Menu isOpen={menuOpen} />
    </div>
  );
};

export default MyAlbums;