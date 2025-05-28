import { createContext, useState, useContext, useEffect } from 'react';
import { 
  loginUser as apiLoginUser, 
  registerUser as apiRegisterUser,
  checkAuthentication, 
  logout as apiLogout 
} from '../components/Api/apiService';
import AuthMessage from '../components/AuthMessage/AuthMessage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const username = localStorage.getItem('username');
      
      if (!token) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        return;
      }
      
      try {
        const isAuth = await checkAuthentication();
        
        if (isAuth) {
          setAuthState({
            user: { username: username || 'Пользователь' },
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } else {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('username');
          
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('username');
        
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Ошибка проверки авторизации'
        });
      }
    };

    verifyAuth();
  }, []);

  const login = async (username, password) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await apiLoginUser(username, password);
      setAuthState({
        user: { username, ...(result.user || {}) },
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Ошибка при входе в систему';
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage
      });
      
      throw new Error(errorMessage);
    }
  };

  const register = async (username, password) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await apiRegisterUser(username, password);
      setAuthState({
        user: { username, ...(result.user || {}) },
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Ошибка при регистрации пользователя';
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage
      });
      
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('username');
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export const RequireAuth = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Загрузка...</div>;
  }
  
  if (!isAuthenticated) {
    return <AuthMessage />;
  }
  
  return children;
};