import React, { useState } from 'react';
import { X, MapPin, Clock, Users, Phone, CheckCircle2, Copy, Check, Send, ThumbsUp, Shield } from 'lucide-react';
import { INCIDENT_TYPES, INCIDENT_STATUSES } from '../../data/incidents';

export default function IncidentModal({
  incident,
  onClose,
  onFocusOnMap,
  onConfirmOutage,
  onStatusChange,
  user,
}) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  if (!incident) return null;

  const incId = incident._id || incident.id;
  const isOrgOrAdmin = user?.role === 'admin' || user?.role === 'organization' || user?.email?.includes('admin') || user?.email?.includes('org');

  const handleCopy = () => {
    navigator.clipboard.writeText(`${incident.district}, ${incident.mahalla}, ${incident.address}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirmOutage(incId);
      setConfirmSuccess(true);
      setTimeout(() => setConfirmSuccess(false), 3000);
    } finally {
      setConfirming(false);
    }
  };

  const getTypeTitle = (type) => {
    if (type === INCIDENT_TYPES.ELECTRICITY) return '⚡ Отключение электроэнергии (Свет)';
    if (type === INCIDENT_TYPES.WATER) return '💧 Отключение воды (Сув таъминоти)';
    if (type === INCIDENT_TYPES.GAS) return '🔥 Отключение природного газа (ГорГаз)';
    return 'Отключение коммунальных услуг';
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="svetanet-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top */}
        <div className="modal-top">
          <div>
            <div className="modal-category">
              {getTypeTitle(incident.type)} • <span className="mono-id">ID: {incId}</span>
            </div>
            <h3 className="modal-heading">{incident.mahalla}</h3>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-scroll-body">
          {/* Status Box */}
          <div className={`status-highlight-box status-${incident.status}`}>
            <div className="status-label">
              Текущий статус:{' '}
              <strong>
                {incident.status === INCIDENT_STATUSES.ACTIVE
                  ? 'Отключено (авария / отключение)'
                  : incident.status === INCIDENT_STATUSES.IN_PROGRESS
                  ? 'Ведутся восстановительные работы'
                  : 'Подача услуги восстановлена'}
              </strong>
            </div>

            {/* Confirmation social proof */}
            <div className="status-confirm-action-row">
              <span className="reports-counter-text">
                👥 От жителей поступило <strong>{incident.reportsCount || 0} подтверждений</strong>.
              </span>
              <button
                className="btn-modal-confirm"
                disabled={confirming}
                onClick={handleConfirm}
              >
                <ThumbsUp size={14} />
                <span>{confirming ? 'Отправка...' : 'Подтвердить отключение (+1)'}</span>
              </button>
            </div>

            {confirmSuccess && (
              <div className="confirm-toast-msg">
                ✅ Спасибо! Ваше подтверждение отправлено в API (POST /api/outages/{incId}/confirm)
              </div>
            )}
          </div>

          {/* Org & Admin Status Control */}
          {isOrgOrAdmin && (
            <div className="admin-status-control-box">
              <div className="control-box-header">
                <Shield size={16} className="text-blue" />
                <span>Управление статусом (для служб и администратора):</span>
              </div>
              <div className="control-box-body">
                <span>Изменить статус инцидента через <code>PATCH /api/outages/{incId}/status</code>:</span>
                <div className="status-btn-group">
                  <button
                    className={`status-choice-btn ${incident.status === 'active' ? 'active red' : ''}`}
                    onClick={() => onStatusChange(incId, 'active')}
                  >
                    Отключено
                  </button>
                  <button
                    className={`status-choice-btn ${incident.status === 'in_progress' ? 'active amber' : ''}`}
                    onClick={() => onStatusChange(incId, 'in_progress')}
                  >
                    В работе
                  </button>
                  <button
                    className={`status-choice-btn ${incident.status === 'resolved' ? 'active green' : ''}`}
                    onClick={() => onStatusChange(incId, 'resolved')}
                  >
                    Восстановлено
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Address & Landmark */}
          <div className="info-block">
            <div className="info-row">
              <MapPin size={16} className="text-muted" />
              <div>
                <div className="info-primary">{incident.address}</div>
                <div className="info-secondary">{incident.district} район, г. Ташкент</div>
              </div>
              <button className="copy-btn" onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Скопировано' : 'Копировать'}</span>
              </button>
            </div>
          </div>

          {/* Time and Households */}
          <div className="stats-row-grid">
            <div className="grid-cell">
              <span className="cell-label">Время отключения</span>
              <span className="cell-value">{incident.reportedAt}</span>
            </div>
            <div className="grid-cell">
              <span className="cell-label">Ориентир включения</span>
              <span className="cell-value text-amber">{incident.estimatedResolution}</span>
            </div>
            <div className="grid-cell">
              <span className="cell-label">Затронуто домов</span>
              <span className="cell-value">{incident.affectedHouses}</span>
            </div>
            <div className="grid-cell">
              <span className="cell-label">Оценка жителей</span>
              <span className="cell-value">~{incident.affectedResidents} чел.</span>
            </div>
          </div>

          {/* Description */}
          <div className="info-section">
            <div className="section-title">Причина и подробности</div>
            <p className="section-text">{incident.description}</p>
          </div>

          {/* Service contacts */}
          <div className="service-contacts-card">
            <div>
              <div className="service-label">Ответственная служба:</div>
              <div className="service-title">{incident.serviceTeam}</div>
              <div className="service-phone">
                Диспетчерская служба: <strong>{incident.dispatcherContact}</strong>
              </div>
            </div>
            <a
              href={`tel:${incident.dispatcherContact.replace(/[^0-9+]/g, '')}`}
              className="call-btn"
            >
              <Phone size={15} />
              <span>Позвонить</span>
            </a>
          </div>
        </div>

        {/* Modal Bottom */}
        <div className="modal-bottom">
          <button
            className="btn-show-map"
            onClick={() => {
              onFocusOnMap(incident);
              onClose();
            }}
          >
            <MapPin size={15} /> Показать на карте
          </button>
          <button className="btn-close" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
