import React, { useState } from 'react';
import './RegisterModal.css';
import { useAuth } from '../../AuthContext/AuthContext'; 

const RegisterModal = ({ isOpen, onClose, openLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (formData.username.trim().length < 3) {
      errors.username = 'Имя пользователя должно содержать минимум 3 символа';
      isValid = false;
    }

    if (formData.password.length < 6) {
      errors.password = 'Пароль должен содержать минимум 6 символов';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают';
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
      await register(formData.username, formData.password);
      onClose();
    } catch (err) {
      const errorMsg = err.message || 'Ошибка при регистрации';
      
      if (errorMsg.includes('с таким именем уже существует')) {
        setFieldErrors({ username: 'Пользователь с таким именем уже существует' });
      } else if (errorMsg.includes('Некорректные данные')) {
        setError('Некорректные данные для регистрации. Пожалуйста, проверьте все поля.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const switchToLogin = (e) => {
    e.preventDefault();
    onClose();
    if (openLogin) {
      setTimeout(() => {
        openLogin();
      }, 300);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Регистрация</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              name="username"
              placeholder="Имя пользователя"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
              className={fieldErrors.username ? 'error' : ''}
            />
            {fieldErrors.username && <div className="field-error">{fieldErrors.username}</div>}
          </div>
          
          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="Пароль"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className={fieldErrors.password ? 'error' : ''}
            />
            {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
          </div>
          
          <div className="input-group">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Подтвердите пароль"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={fieldErrors.confirmPassword ? 'error' : ''}
            />
            {fieldErrors.confirmPassword && <div className="field-error">{fieldErrors.confirmPassword}</div>}
          </div>
          
          <button 
            type="submit" 
            className="register-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
          
          <p className="login-link" onClick={switchToLogin}>
            Уже есть аккаунт? Войти
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;