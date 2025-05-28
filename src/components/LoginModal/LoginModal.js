import React, { useState } from 'react';
import './LoginModal.css';
import { useAuth } from '../../AuthContext/AuthContext';

const LoginModal = ({ isOpen, onClose, openRegister }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (credentials.username.trim() === '') {
      errors.username = 'Имя пользователя не может быть пустым';
      isValid = false;
    }

    if (credentials.password === '') {
      errors.password = 'Введите пароль';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      await login(credentials.username, credentials.password);
      onClose();
    } catch (error) {
      const errorMessage = error.message || 'Ошибка при входе в систему';
      
      if (errorMessage.includes('Неверное имя пользователя или пароль')) {
        setError('Неверное имя пользователя или пароль');
      } else if (errorMessage.includes('Пользователь не найден')) {
        setFieldErrors({ username: 'Пользователь не найден' });
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Вход</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              name="username"
              placeholder="Имя пользователя"
              value={credentials.username}
              onChange={handleChange}
              required
              className={fieldErrors.username ? 'error' : ''}
            />
            {fieldErrors.username && <div className="field-error">{fieldErrors.username}</div>}
          </div>
          
          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="Пароль"
              value={credentials.password}
              onChange={handleChange}
              required
              className={fieldErrors.password ? 'error' : ''}
            />
            {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
          </div>
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <p className="register-link" onClick={openRegister}>
          Нет аккаунта? Зарегистрироваться
        </p>
      </div>
    </div>
  );
};

export default LoginModal;