import React from 'react';
import { Zap, Phone, PlusCircle, Menu, X, Send } from 'lucide-react';

export default function Navbar({
  onOpenReportModal,
  isSidebarOpen,
  onToggleSidebar,
}) {
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
              WarnTech <span className="brand-tag">Ташкент</span>
            </div>
            <div className="brand-desc">Мониторинг отключений света, воды и газа (SvetaNet)</div>
          </div>
        </div>

        <div className="city-pill">
          <span className="live-bullet"></span>
          <span>г. Ташкент (Toshkent shahri)</span>
        </div>
      </div>

      <div className="header-right">
        {/* Hotlines info */}
        <div className="hotlines-bar">
          <span className="hotline-item">РЭС: <strong>1154</strong></span>
          <span className="hotline-sep">•</span>
          <span className="hotline-item">ГорГаз: <strong>104</strong></span>
          <span className="hotline-sep">•</span>
          <span className="hotline-item">Сув: <strong>1055</strong></span>
        </div>

        <button className="btn-report-outage" onClick={onOpenReportModal}>
          <PlusCircle size={16} />
          <span>Сообщить об отключении</span>
        </button>
      </div>
    </header>
  );
}
