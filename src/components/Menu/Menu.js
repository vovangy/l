import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Menu.css';
import { useAuth } from '../../AuthContext/AuthContext';

function Menu({ isOpen }) {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const handleTop100Click = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className={`menu ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="menu-items">
        {isAuthenticated && (
          <div className="user-info">
            <span className="username">{user?.username || 'Пользователь'}</span>
          </div>
        )}
        
        <Link to="/my-albums" className="menu-item">Альбомы</Link>
        <Link to="/my-music" className="menu-item">Моя музыка</Link>
        <Link to="/playlists" className="menu-item">Мои плейлисты</Link>
        <div className="menu-item" onClick={handleTop100Click}>Топ-100</div>
        
        {isAuthenticated ? (
          <div className="menu-item logout" onClick={handleLogout}>Выйти</div>
        ) : (
          <div className="menu-item" onClick={() => navigate('/?login=true')}>Войти</div>
        )}
      </div>
    </div>
  );
}

export default Menu;