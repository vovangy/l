import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import MainScreen from './components/MainScreen/MainScreen';
import Menu from './components/Menu/Menu';
import LoginModal from './components/LoginModal/LoginModal';
import RegisterModal from './components/RegisterModal/RegisterModal';
import Spots from './components/Spots/Spots';
import MyMusic from './components/MyMusic/MyMusic';
import MyAlbums from './components/MyAlbums/MyAlbums';
import AlbumPage from './components/AlbumPage/AlbumPage';
import PlaylistsPage from './components/PlaylistsPage/PlaylistsPage';
import PlaylistDetailPage from './components/PlaylistDetailPage/PlaylistDetailPage';
import { AuthProvider, useAuth } from './AuthContext/AuthContext';
import AuthMessage from './components/AuthMessage/AuthMessage';

const RecommendAuth = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showMessage, setShowMessage] = useState(false);
  const location = useLocation();

  useEffect(() => {

    if (!isAuthenticated && !isLoading && !localStorage.getItem('notification_shown')) {
      setShowMessage(true);
      localStorage.setItem('notification_shown', 'true');
      
  
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, location.pathname]);

  if (isLoading) {
    return <div className="loading">Загрузка...</div>;
    }
    
    return (
      <>
      {children}
      {!isAuthenticated && showMessage && (
        <div className="auth-notification">
          <AuthMessage />
          <button className="close-notification" onClick={() => setShowMessage(false)}>×</button>
        </div>
      )}
      </>
    );
};

function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const appRef = useRef(null);
  const contentRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const contentHeight = contentRef.current.scrollHeight;
      const scrollPosition = window.scrollY + window.innerHeight;
      
      if (scrollPosition >= contentHeight) {
        window.scrollTo({
          top: contentHeight - window.innerHeight,
          behavior: 'auto'
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('login') === 'true' && !isAuthenticated) {
      setLoginOpen(true);
    }
  }, [location, isAuthenticated]);

  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };

  const openLoginModal = () => {
    setLoginOpen(true);
  };

  return (
    <div className="app" ref={appRef} onClick={() => menuOpen && setMenuOpen(false)}>
      <div className="app-content" ref={contentRef}>
        <Routes>
          {/* Маршруты, доступные без авторизации, но с рекомендацией регистрации */}
          <Route 
            path="/my-music" 
            element={
              <RecommendAuth>
                <MyMusic 
                  toggleMenu={toggleMenu}
                  openLogin={openLoginModal}
                />
              </RecommendAuth>
            } 
          />
          
          <Route 
            path="/playlists" 
            element={
              <RecommendAuth>
                <PlaylistsPage />
              </RecommendAuth>
            } 
          />
          
          <Route 
            path="/playlist/:playlistId" 
            element={
              <RecommendAuth>
                <PlaylistDetailPage />
              </RecommendAuth>
            } 
          />

          {/* Маршрут для страницы альбомов */}
          <Route 
            path="/my-albums" 
            element={
              <MyAlbums 
                toggleMenu={toggleMenu}
                openLogin={openLoginModal}
              />
            } 
          />

          {/* Маршрут для страницы альбома */}
          <Route path="/album/:albumId" element={<AlbumPage />} />

          {/* Основной маршрут */}
          <Route 
            path="/" 
            element={
              <MainScreen 
                menuOpen={menuOpen} 
                toggleMenu={toggleMenu}
                openLogin={openLoginModal}
              >
                <Spots />
              </MainScreen>
            } 
          />

          {/* Перенаправление для неизвестных маршрутов */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <div className="scroll-lock" />
      </div>
      
      <Menu 
        isOpen={menuOpen}
      />
      
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
        openLogin={() => {
          setRegisterOpen(false);
          setLoginOpen(true);
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;