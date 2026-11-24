import React from 'react';
import { INCIDENT_TYPES, INCIDENT_STATUSES } from '../../data/incidents';

export default function StatsBanner({ incidents, onSelectTypeFilter, activeTypeFilter }) {
  const electricityCount = incidents.filter(i => i.type === INCIDENT_TYPES.ELECTRICITY && i.status !== INCIDENT_STATUSES.RESOLVED).length;
  const waterCount = incidents.filter(i => i.type === INCIDENT_TYPES.WATER && i.status !== INCIDENT_STATUSES.RESOLVED).length;
  const gasCount = incidents.filter(i => i.type === INCIDENT_TYPES.GAS && i.status !== INCIDENT_STATUSES.RESOLVED).length;
  const resolvedToday = incidents.filter(i => i.status === INCIDENT_STATUSES.RESOLVED).length;
  const totalReports = incidents.reduce((sum, item) => sum + (item.reportsCount || 0), 0);

  return (
    <div className="svetanet-stats-bar">
      <div
        className={`stat-pill ${activeTypeFilter === 'all' ? 'active' : ''}`}
        onClick={() => onSelectTypeFilter('all')}
      >
        <span className="pill-title">Все отключения:</span>
        <span className="pill-value">{incidents.length}</span>
      </div>

      <div
        className={`stat-pill pill-electricity ${activeTypeFilter === INCIDENT_TYPES.ELECTRICITY ? 'active' : ''}`}
        onClick={() => onSelectTypeFilter(INCIDENT_TYPES.ELECTRICITY)}
      >
        <span className="pill-icon">⚡</span>
        <span className="pill-title">Свет:</span>
        <span className="pill-value">{electricityCount}</span>
        <span className="pill-hint">районов</span>
      </div>

      <div
        className={`stat-pill pill-water ${activeTypeFilter === INCIDENT_TYPES.WATER ? 'active' : ''}`}
        onClick={() => onSelectTypeFilter(INCIDENT_TYPES.WATER)}
      >
        <span className="pill-icon">💧</span>
        <span className="pill-title">Вода:</span>
        <span className="pill-value">{waterCount}</span>
        <span className="pill-hint">участков</span>
      </div>

      <div
        className={`stat-pill pill-gas ${activeTypeFilter === INCIDENT_TYPES.GAS ? 'active' : ''}`}
        onClick={() => onSelectTypeFilter(INCIDENT_TYPES.GAS)}
      >
        <span className="pill-icon">🔥</span>
        <span className="pill-title">Газ:</span>
        <span className="pill-value">{gasCount}</span>
        <span className="pill-hint">участков</span>
      </div>

      <div className="stat-pill pill-community">
        <span className="pill-icon">👥</span>
        <span className="pill-title">Сообщений от жителей:</span>
        <span className="pill-value text-blue">{totalReports}</span>
      </div>

      <div className="stat-pill pill-resolved">
        <span className="pill-icon">✅</span>
        <span className="pill-title">Восстановлено за сутки:</span>
        <span className="pill-value text-green">{resolvedToday}</span>
      </div>
    </div>
  );
}
