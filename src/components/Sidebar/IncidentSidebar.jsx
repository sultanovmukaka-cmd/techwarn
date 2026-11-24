import React, { useState } from 'react';
import { Search, X, MapPin, Clock, Users, ChevronRight, ThumbsUp } from 'lucide-react';
import { INCIDENT_TYPES, INCIDENT_STATUSES, TASHKENT_DISTRICTS } from '../../data/incidents';

export default function IncidentSidebar({
  incidents,
  allIncidents,
  selectedIncident,
  onSelectIncident,
  onOpenDetails,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  selectedDistrict,
  onSelectDistrict,
  onConfirmOutage,
  onStatusChange,
  user,
  isOpen,
}) {
  const [confirmingId, setConfirmingId] = useState(null);

  const electricityCount = allIncidents.filter((i) => i.type === INCIDENT_TYPES.ELECTRICITY).length;
  const waterCount = allIncidents.filter((i) => i.type === INCIDENT_TYPES.WATER).length;
  const gasCount = allIncidents.filter((i) => i.type === INCIDENT_TYPES.GAS).length;

  const isOrgOrAdmin = user?.role === 'admin' || user?.role === 'organization' || user?.email?.includes('admin') || user?.email?.includes('org');

  const getStatusBadge = (status) => {
    switch (status) {
      case INCIDENT_STATUSES.ACTIVE:
        return <span className="badge badge-outage">Отключено</span>;
      case INCIDENT_STATUSES.IN_PROGRESS:
        return <span className="badge badge-work">Идет ремонт</span>;
      case INCIDENT_STATUSES.RESOLVED:
        return <span className="badge badge-resolved">Включили</span>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type) => {
    if (type === INCIDENT_TYPES.ELECTRICITY) return '⚡';
    if (type === INCIDENT_TYPES.WATER) return '💧';
    if (type === INCIDENT_TYPES.GAS) return '🔥';
    return '⚠️';
  };

  const handleConfirm = async (e, id) => {
    e.stopPropagation();
    setConfirmingId(id);
    try {
      await onConfirmOutage(id);
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <aside className={`svetanet-sidebar ${isOpen ? 'is-open' : ''}`}>
      {/* Search and District Filter Header */}
      <div className="sidebar-top-section">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Поиск по улице, махалле, ориентиру..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => onSearchChange('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* District Selector Dropdown */}
        <div className="district-filter-row">
          <label className="district-label">Район:</label>
          <select
            className="district-select"
            value={selectedDistrict}
            onChange={(e) => onSelectDistrict(e.target.value)}
          >
            {TASHKENT_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs">
          <button
            className={`tab-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => onFilterTypeChange('all')}
          >
            Все ({allIncidents.length})
          </button>
          <button
            className={`tab-btn tab-electricity ${filterType === INCIDENT_TYPES.ELECTRICITY ? 'active' : ''}`}
            onClick={() => onFilterTypeChange(INCIDENT_TYPES.ELECTRICITY)}
          >
            ⚡ Свет ({electricityCount})
          </button>
          <button
            className={`tab-btn tab-water ${filterType === INCIDENT_TYPES.WATER ? 'active' : ''}`}
            onClick={() => onFilterTypeChange(INCIDENT_TYPES.WATER)}
          >
            💧 Вода ({waterCount})
          </button>
          <button
            className={`tab-btn tab-gas ${filterType === INCIDENT_TYPES.GAS ? 'active' : ''}`}
            onClick={() => onFilterTypeChange(INCIDENT_TYPES.GAS)}
          >
            🔥 Газ ({gasCount})
          </button>
        </div>
      </div>

      {/* Outage Items List */}
      <div className="outage-list">
        <div className="list-header-info">
          <span>Найдено участков: <strong>{incidents.length}</strong></span>
          {selectedDistrict !== 'Все районы' && (
            <span className="district-tag">{selectedDistrict}</span>
          )}
        </div>

        {incidents.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon">✅</div>
            <h4>Отключений не зафиксировано</h4>
            <p>По выбранным фильтрам сообщений от жителей и данных РЭС нет.</p>
            <button
              className="reset-btn"
              onClick={() => {
                onSearchChange('');
                onFilterTypeChange('all');
                onSelectDistrict('Все районы');
              }}
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          incidents.map((inc) => {
            const incId = inc._id || inc.id;
            const isSelected = selectedIncident && (selectedIncident.id === incId || selectedIncident._id === incId);

            return (
              <div
                key={incId}
                className={`outage-card type-${inc.type} ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectIncident(inc)}
              >
                <div className="outage-card-top">
                  <div className="mahalla-header">
                    <span className="type-symbol">{getTypeIcon(inc.type)}</span>
                    <span className="mahalla-name">{inc.mahalla}</span>
                  </div>
                  {getStatusBadge(inc.status)}
                </div>

                <div className="outage-title">{inc.title}</div>

                <div className="outage-address">
                  <MapPin size={13} className="pin-icon" />
                  <span>{inc.address}</span>
                </div>

                <div className="card-social-row">
                  <div className="community-reports-badge">
                    <Users size={12} />
                    <span>{inc.reportsCount || 0} подтверждений</span>
                  </div>

                  {/* POST /api/outages/:id/confirm action button */}
                  <button
                    className="btn-confirm-outage"
                    disabled={confirmingId === incId}
                    onClick={(e) => handleConfirm(e, incId)}
                    title="Подтвердить отключение (+1 в базу API)"
                  >
                    <ThumbsUp size={12} />
                    <span>{confirmingId === incId ? '...' : '+1 Тоже нет'}</span>
                  </button>
                </div>

                <div className="outage-time-info">
                  <span className="time-item">
                    <Clock size={12} /> с {inc.reportedAt.split(' ')[1] || inc.reportedAt}
                  </span>
                  <span className="time-item est-time">
                    Ориентир: до {inc.estimatedResolution.split(' ')[1] || inc.estimatedResolution}
                  </span>
                </div>

                {/* For Organization & Admin: PATCH status selector */}
                {isOrgOrAdmin && (
                  <div className="card-admin-action" onClick={(e) => e.stopPropagation()}>
                    <span className="admin-label">Статус (PATCH):</span>
                    <select
                      className="status-patch-select"
                      value={inc.status}
                      onChange={(e) => onStatusChange(incId, e.target.value)}
                    >
                      <option value="active">Отключено</option>
                      <option value="in_progress">В работе</option>
                      <option value="resolved">Восстановлено</option>
                    </select>
                  </div>
                )}

                <div className="outage-card-footer">
                  <span className="service-short">{inc.serviceTeam?.split('(')[0] || 'Служба'}</span>
                  <button
                    className="details-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetails(inc);
                    }}
                  >
                    Подробнее <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
