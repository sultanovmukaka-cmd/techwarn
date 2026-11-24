import React from 'react';
import { PlusCircle, Menu, X, LogIn, LogOut, Shield, Building2, User, RefreshCw } from 'lucide-react';

export default function Navbar({
  onOpenReportModal,
  onOpenAuthModal,
  onOpenCabinetModal,
  user,
  onLogout,
  isApiOnline,
  onRefreshApi,
  isSidebarOpen,
  onToggleSidebar,
}) {
  const isAdmin = user?.role === 'admin' || user?.email === 'admin@netsveta.dev';
  const isOrg = isAdmin || user?.role === 'organization' || user?.email === 'org@netsveta.dev';

  return (
    <header className="svetanet-header">
      <div className="header-left">
        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Закрыть список' : 'Открыть список'}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="brand-block">
          <div className="brand-logo">
            <span className="logo-emoji">⚡</span>
          </div>
          <div className="brand-info">
            <div className="brand-name">
              WarnTech <span className="brand-tag">API:4000</span>
            </div>
            <div className="brand-desc">Мониторинг аварий и отключений Ташкента (SvetaNet)</div>
          </div>
        </div>

        {/* API Status Indicator */}
        <div
          className={`api-status-badge ${isApiOnline ? 'api-online' : 'api-offline'}`}
          title={isApiOnline ? 'Подключено к backend API (http://localhost:4000)' : 'Backend API недоступен, активен автономный режим'}
          onClick={onRefreshApi}
        >
          <span className="api-dot"></span>
          <span className="api-text">
            {isApiOnline ? 'API Онлайн' : 'API Офлайн'}
          </span>
          <RefreshCw size={12} className="api-refresh-icon" />
        </div>
      </div>

      <div className="header-right">
        {/* Hotlines bar */}
        <div className="hotlines-bar">
          <span className="hotline-item">РЭС: <strong>1154</strong></span>
          <span className="hotline-sep">•</span>
          <span className="hotline-item">ГорГаз: <strong>104</strong></span>
          <span className="hotline-sep">•</span>
          <span className="hotline-item">Сув: <strong>1055</strong></span>
        </div>

        {/* User Auth Section */}
        {user ? (
          <div className="user-profile-controls">
            <button className="user-cabinet-btn" onClick={onOpenCabinetModal}>
              {isAdmin ? (
                <Shield size={14} className="text-red" />
              ) : isOrg ? (
                <Building2 size={14} className="text-blue" />
              ) : (
                <User size={14} />
              )}
              <span className="user-email-text">{user.email}</span>
              <span className="user-role-badge">
                {isAdmin ? 'Админ' : isOrg ? 'Служба' : 'Житель'}
              </span>
            </button>
            <button className="user-logout-btn" onClick={onLogout} title="Выйти из аккаунта">
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button className="btn-auth-login" onClick={onOpenAuthModal}>
            <LogIn size={15} />
            <span>Вход (Служба / Админ)</span>
          </button>
        )}

        <button className="btn-report-outage" onClick={onOpenReportModal}>
          <PlusCircle size={16} />
          <span>Сообщить об отключении</span>
        </button>
      </div>
    </header>
  );
}
