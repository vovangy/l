import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AlbumPage.css';
import { fetchAlbums, fetchAlbumTracks, addToFavorites, fetchPlaylists, addTrackToPlaylist, addAlbumToFavorites, createPlaylist, searchTracks } from '../Api/apiService';
import Player from '../Player/Player';
import { useAuth } from '../../AuthContext/AuthContext';
import Spots from '../Spots/Spots';
import LoginModal from '../LoginModal/LoginModal';
import RegisterModal from '../RegisterModal/RegisterModal';
import Menu from '../Menu/Menu';

const AlbumPage = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [filteredTracks, setFilteredTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [isAlbumFavorite, setIsAlbumFavorite] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { isAuthenticated, logout} = useAuth();
  
  const [activeTrackMenu, setActiveTrackMenu] = useState(null);
  const [activePlaylistMenu, setActivePlaylistMenu] = useState(null);
  const [playlists, setPlaylists] = useState([]);

  const uniqueTracksById = (tracks) => {
    const uniqueTracks = [];
    const trackIds = new Set();
    
    tracks.forEach(track => {
      const trackId = track.ID || track.id;
      if (trackId && !trackIds.has(trackId)) {
        trackIds.add(trackId);
        uniqueTracks.push(track);
      }
    });
    
    return uniqueTracks;
  };

  useEffect(() => {
    if (!searchQuery || !album) {
      setFilteredTracks(tracks);
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
        
        const filteredResults = searchResults.filter(track => {
          const trackAlbumId = track.albumId || track.album_id || track.AlbumId || track.AlbumID;
          return trackAlbumId && (trackAlbumId.toString() === albumId || trackAlbumId === parseInt(albumId));
        });
        
        if (filteredResults.length === 0) {
          const localFiltered = tracks.filter(track => 
            track.Title && track.Title.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setFilteredTracks(uniqueTracksById(localFiltered));
        } else {
          const tracksWithAlbumInfo = filteredResults.map(track => ({
            ...track,
            AlbumUrlImage: album.UrlImage,
            albumUrlImage: album.UrlImage,
            album: album.Title,
            Album: album.Title,
            artist: album.ArtistName,
            Artist: album.ArtistName,
            albumId: album.ID,
            album_id: album.ID,
            AlbumId: album.ID,
            AlbumID: album.ID
          }));
          
          setFilteredTracks(uniqueTracksById(tracksWithAlbumInfo));
        }
      } catch (error) {
        const localFiltered = tracks.filter(track => 
          track.Title && track.Title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredTracks(uniqueTracksById(localFiltered));
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, tracks, album, albumId]);

  const toggleSearch = () => {
    setShowSearch(prev => !prev);
  };

  useEffect(() => {
    const loadAlbum = async () => {
      setLoading(true);
      try {
        const albumsData = await fetchAlbums();
        const albumsList = Array.isArray(albumsData.payload) ? albumsData.payload : [];
        const foundAlbum = albumsList.find(item => item.ID === parseInt(albumId));
        
        if (!foundAlbum) {
          setLoading(false);
          return;
        }
        
        setAlbum(foundAlbum);
        const tracksData = await fetchAlbumTracks(foundAlbum.ID);
        let processedTracks = Array.isArray(tracksData) 
          ? tracksData 
          : tracksData?.tracks || tracksData?.payload || [];
        
        // Удаляем дубликаты треков по ID
        const trackIds = new Set();
        processedTracks = processedTracks.filter(track => {
          const trackId = track.ID || track.id;
          if (!trackId || trackIds.has(trackId)) return false;
          trackIds.add(trackId);
          return true;
        });
          
        const tracksWithAlbumInfo = processedTracks.map(track => ({
          ...track,
          AlbumUrlImage: foundAlbum.UrlImage,
          albumUrlImage: foundAlbum.UrlImage,
          album: foundAlbum.Title,
          Album: foundAlbum.Title,
          artist: foundAlbum.ArtistName,
          Artist: foundAlbum.ArtistName,
          albumId: foundAlbum.ID,
          album_id: foundAlbum.ID,
          AlbumId: foundAlbum.ID,
          AlbumID: foundAlbum.ID
        }));
          
        setTracks(tracksWithAlbumInfo);
        setFilteredTracks(tracksWithAlbumInfo);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    if (albumId) {
      loadAlbum();
    }
  }, [albumId]);


  useEffect(() => {
    const loadPlaylists = async () => {
      if (!isAuthenticated) return;
      
      try {
        const playlistsData = await fetchPlaylists();
        
        if (Array.isArray(playlistsData) && playlistsData.length > 0) {
          setPlaylists(playlistsData);
        } else if (playlistsData?.payload) {
          setPlaylists(playlistsData.payload);
        } else {
          setPlaylists([]);
        }
      } catch (error) {
        setPlaylists([]);
      }
    };
    
    loadPlaylists();
  }, [isAuthenticated]);


  const handleAddToMyMusic = async (track) => {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }

    try {
      const trackData = {
        id: track.ID,
        ID: track.ID,
        title: track.Title,
        Title: track.Title,
        album: album.Title,
        Album: album.Title,
        albumId: album.ID,
        album_id: album.ID,
        AlbumId: album.ID,
        AlbumID: album.ID,
        artist: album.ArtistName,
        Artist: album.ArtistName,
        duration: track.Duration || "0:00",
        Duration: track.Duration || "0:00",
        albumUrlImage: album.UrlImage,
        AlbumUrlImage: album.UrlImage
      };
      
      const result = await addToFavorites(track.ID, trackData);
    } catch (error) {
    } finally {
      setActiveTrackMenu(null);
    }
  };

  const handleAddToPlaylist = async (trackId, playlistId) => {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }

    try {
      const currentTrack = tracks.find(t => t.ID === trackId);
      
      if (!currentTrack) {
        throw new Error('Трек не найден');
      }
      
      const trackData = {
        id: trackId,
        title: currentTrack.Title,
        album: album.Title,
        albumId: album.ID,
        artist: album.ArtistName,
        duration: currentTrack.Duration || "0:00",
        albumUrlImage: album.UrlImage
      };
      
      const result = await addTrackToPlaylist(playlistId, trackId, trackData);
    } catch (error) {
    } finally {
      setActiveTrackMenu(null);
      setActivePlaylistMenu(null);
    }
  };

  const handleCreatePlaylist = async (trackId) => {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    
    const playlistName = prompt('Введите название нового плейлиста:');
    if (!playlistName) return; 

    try {
      // Создаем новый плейлист
      const result = await createPlaylist(playlistName);
      
      if (result && result.success) {
        const newPlaylistId = result.payload.ID || result.payload.id;
        const updatedPlaylists = await fetchPlaylists();
        setPlaylists(updatedPlaylists);
        
        if (trackId) {
          const currentTrack = tracks.find(t => t.ID === trackId);
          if (currentTrack) {
            const trackData = {
              id: trackId,
              title: currentTrack.Title,
              album: album.Title,
              albumId: album.ID,
              artist: album.ArtistName,
              duration: currentTrack.Duration || "0:00",
              albumUrlImage: album.UrlImage
            };
            
            await addTrackToPlaylist(newPlaylistId, trackId, trackData);
          }
        }
      }
    } catch (err) {
    } finally {
      setActiveTrackMenu(null);
      setActivePlaylistMenu(null);
    }
  };

  const handlePlayTrack = (track) => {
    setCurrentTrack(track);
  };

  const handleTrackChange = (direction) => {
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(track => track.ID === currentTrack.ID);
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
    navigate(-1);
  };

  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };

  const handleOpenLogin = () => {
    setLoginOpen(true);
  };

  const handleMusicClick = () => {
    navigate('/my-music');
  };

  const handlePlaylistsClick = () => {
    navigate('/playlists');
  };

  const handleAlbumsClick = () => {
    navigate('/my-albums');
  };

  const handleCloseAllScreens = () => {
    navigate('/');
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      const trackMenus = document.querySelectorAll('.track-menu-container');
      let clickedInsideMenu = false;
      
      trackMenus.forEach(menu => {
        if (menu.contains(e.target)) {
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

  const handleAddAlbumToFavorites = async () => {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }

    try {
      const albumData = {
        id: album.ID,
        title: album.Title,
        artist: album.ArtistName,
        urlImage: album.UrlImage,
        Title: album.Title,
        ArtistName: album.ArtistName,
        UrlImage: album.UrlImage,
        ID: album.ID
      };
      
      const result = await addAlbumToFavorites(album.ID, albumData);
      setIsAlbumFavorite(true);
    } catch (error) {
    }
  };

  if (loading) {
    return (
      <div className="album-page-loading">
        <div className="spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="album-page-error">
        <p>Альбом не найден</p>
        <button onClick={handleBack}>Вернуться назад</button>
      </div>
    );
  }

  return (
    <div className="album-page" onClick={() => {
      setActiveTrackMenu(null);
      setActivePlaylistMenu(null);
      menuOpen && setMenuOpen(false);
    }}>
      <Spots />
      
      <div className="album-page-header">
        <div className="left-buttons">
          <button 
            className="menu-button" 
            onClick={(e) => {
              e.stopPropagation();
              toggleMenu();
            }}
          >
            ☰
          </button>
        </div>
        
        <div className="right-buttons">
          <button 
            className="search-button"
            onClick={toggleSearch}
          >
            Поиск
          </button>
          <button 
            className="exit-button"
            onClick={isAuthenticated ? logout : handleOpenLogin}
          >
            {isAuthenticated ? 'Выход' : 'Вход'}
          </button>
        </div>
      </div>
      
      <div className={`search-container ${showSearch ? 'active' : 'hidden'}`}>
        <input
          type="text"
          placeholder="Поиск треков..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="album-page-content">
        <div className="album-page-artist-section">
          <div className="artist-photo-container">
            <img 
              src={album.ArtistImageUrl || album.UrlImage} 
              alt={`Фото артиста ${album.ArtistName}`} 
              className="artist-photo"
            />
            <h2 className="artist-name">{album.ArtistName}</h2>
          </div>
          
         
        </div>
        
        <div className="album-page-title-section">
          <div className="album-icon">♪</div>
          <h1 className="album-title">{album.Title}</h1>
          <button 
            className="album-favorite-button"
            onClick={handleAddAlbumToFavorites}
            title="Добавить альбом в избранное"
          >
            {isAlbumFavorite ? '❤️' : '♡'}
          </button>
        </div>
        
        <div className="album-content-section">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <div>Загрузка...</div>
            </div>
          ) : (
        <div className="album-page-tracks-section">
              {searching ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <div>Поиск треков...</div>
                </div>
              ) : filteredTracks.length > 0 ? (
            <div className="tracks-list">
                  {filteredTracks.map((track, index) => (
                <div 
                  key={track.ID || index} 
                  className={`track-item ${currentTrack?.ID === track.ID ? 'playing' : ''}`}
                >
                  <div className="track-main-info">
                    <button 
                      className="track-play-button" 
                      onClick={() => handlePlayTrack(track)}
                    >
                      {currentTrack?.ID === track.ID ? '⏸' : '▶'}
                    </button>
                    <span className="track-title">{track.Title || `Трек ${index + 1}`}</span>
                  </div>
                  
                  <div className="track-actions">
                    <button 
                      className="track-action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTrackMenu(track.ID);
                      }}
                      title="Меню"
                    >
                      ⋯
                    </button>
                    
                    {activeTrackMenu === track.ID && (
                      <div className="track-menu" onClick={e => e.stopPropagation()}>
                        <div 
                          className="track-menu-item"
                          onClick={() => handleAddToMyMusic(track)}
                        >
                          Добавить в мою музыку
                        </div>
                        <div 
                          className="track-menu-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlaylistMenu(track.ID, e);
                          }}
                        >
                          Добавить в плейлист
                        </div>
                      </div>
                    )}
                    
                    {activePlaylistMenu === track.ID && (
                      <div className="playlists-dropdown" onClick={e => e.stopPropagation()}>
                        <div className="playlists-dropdown-header">
                          Выберите плейлист
                        </div>
                        <div 
                          className="playlist-item create-new"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreatePlaylist(track.ID);
                          }}
                        >
                          + Создать новый плейлист
                        </div>
                        {playlists.length > 0 ? (
                          playlists.map(playlist => {
                            const playlistId = playlist.ID || playlist.id;
                            const uniqueKey = playlistId ? 
                              `playlist-${playlistId}-${track.ID}` : 
                              `playlist-item-${Math.random().toString(36).substr(2, 9)}`;
                            
                            return (
                              <div 
                                key={uniqueKey} 
                                className="playlist-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToPlaylist(track.ID, playlistId);
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
            searchQuery ? (
              <div className="no-tracks">Треки не найдены по запросу "{searchQuery}"</div>
            ) : (
              <div className="no-tracks">Треки не найдены</div>
            )
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Плеер внизу страницы */}
      <Player 
        currentTrack={currentTrack} 
        onTrackChange={handleTrackChange} 
      />
      
      {/* Меню */}
      <Menu 
        isOpen={menuOpen}
        onMusicClick={handleMusicClick}
        onPlaylistsClick={handlePlaylistsClick}
        onAlbumsClick={handleAlbumsClick}
        onCloseAll={handleCloseAllScreens}
      />
      
      {/* Модальные окна для входа и регистрации */}
      <LoginModal 
        isOpen={loginOpen} 
        onClose={() => setLoginOpen(false)}
        openRegister={() => {
          setLoginOpen(false);
          setRegisterOpen(true);
        }}
      />
      <RegisterModal 
        isOpen={registerOpen} 
        onClose={() => setRegisterOpen(false)}
        openLogin={() => setLoginOpen(true)}
      />
    </div>
  );
};

export default AlbumPage; 