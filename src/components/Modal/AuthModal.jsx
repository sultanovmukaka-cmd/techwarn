import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, Building2, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleQuickLogin = (demoEmail, demoPass = 'password123') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        const { token, user } = await api.login(email, password);
        setSuccessMsg(`Успешный вход как ${user.email} (${user.role || 'пользователь'})`);
        setTimeout(() => {
          onAuthSuccess(user, token);
          onClose();
        }, 800);
      } else {
        const { token, user } = await api.register({ email, password, name });
        setSuccessMsg('Регистрация успешна! Добро пожаловать.');
        setTimeout(() => {
          onAuthSuccess(user, token);
          onClose();
        }, 800);
      }
    } catch (err) {
      console.warn('Auth error:', err);
      // If server is not responding, give user friendly offline test mode fallback
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.status === 0) {
        const fallbackRole = email.includes('admin') ? 'admin' : email.includes('org') ? 'organization' : 'user';
        const mockUser = { email, role: fallbackRole, name: name || email.split('@')[0] };
        api.login(email, password).catch(() => {}); // silent
        setSuccessMsg(`Сервер офлайн: выполнен вход в режиме симуляции (${mockUser.role})`);
        setTimeout(() => {
          onAuthSuccess(mockUser, 'demo-offline-token');
          onClose();
        }, 1000);
      } else {
        setError(err.message || 'Ошибка авторизации. Проверьте данные.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="svetanet-modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <div>
            <div className="modal-category">Авторизация в системе WarnTech API</div>
            <h3 className="modal-heading">
              {isLogin ? 'Вход в личный кабинет' : 'Регистрация нового пользователя'}
            </h3>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>

        <div className="modal-scroll-body">
          {/* Quick presets for test accounts */}
          <div className="quick-roles-presets">
            <span className="preset-label">Быстрый выбор тестовой роли:</span>
            <div className="presets-btns">
              <button
                type="button"
                className="preset-btn btn-org"
                onClick={() => handleQuickLogin('org@netsveta.dev')}
              >
                <Building2 size={13} />
                <span>org@netsveta.dev (Организация)</span>
              </button>
              <button
                type="button"
                className="preset-btn btn-admin"
                onClick={() => handleQuickLogin('admin@netsveta.dev')}
              >
                <Shield size={13} />
                <span>admin@netsveta.dev (Админ)</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-alert error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="auth-alert success">
              <CheckCircle size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-field">
                <label className="field-label">Ваше имя / Название службы</label>
                <div className="input-with-icon">
                  <User size={16} className="field-icon" />
                  <input
                    type="text"
                    required
                    className="input-text with-icon"
                    placeholder="Например: Диспетчер РЭС"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-field">
              <label className="field-label">Электронная почта (Email) *</label>
              <div className="input-with-icon">
                <Mail size={16} className="field-icon" />
                <input
                  type="email"
                  required
                  className="input-text with-icon"
                  placeholder="org@netsveta.dev или admin@netsveta.dev"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="field-label">Пароль *</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" />
                <input
                  type="password"
                  required
                  className="input-text with-icon"
                  placeholder="Введите пароль..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-submit-row">
              <button type="submit" className="btn-primary-auth" disabled={loading}>
                {loading ? 'Проверка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </div>
          </form>

          <div className="auth-switch-link">
            {isLogin ? (
              <span>
                Еще нет аккаунта?{' '}
                <button type="button" onClick={() => setIsLogin(false)}>
                  Зарегистрироваться
                </button>
              </span>
            ) : (
              <span>
                Уже зарегистрированы?{' '}
                <button type="button" onClick={() => setIsLogin(true)}>
                  Войти
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
