import React, { useState } from 'react';
import { X, MapPin, Clock, Users, Phone, CheckCircle2, Copy, Check, Send } from 'lucide-react';
import { INCIDENT_TYPES, INCIDENT_STATUSES } from '../../data/incidents';

export default function IncidentModal({ incident, onClose, onFocusOnMap }) {
  const [copied, setCopied] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [extraInfo, setExtraInfo] = useState('');

  if (!incident) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${incident.district}, ${incident.mahalla}, ${incident.address}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendExtra = (e) => {
    e.preventDefault();
    if (!extraInfo.trim()) return;
    setReportSuccess(true);
    setTimeout(() => {
      setExtraInfo('');
      setReportSuccess(false);
    }, 2500);
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
            <div className="modal-category">{getTypeTitle(incident.type)}</div>
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
              Текущий статус: <strong>
                {incident.status === INCIDENT_STATUSES.ACTIVE
                  ? 'Отключено (авария / отключение)'
                  : incident.status === INCIDENT_STATUSES.IN_PROGRESS
                  ? 'Ведутся восстановительные работы'
                  : 'Подача услуги восстановлена'}
              </strong>
            </div>
            {incident.reportsCount > 0 && (
              <div className="status-sub">
                👥 От жителей поступило <strong>{incident.reportsCount} сообщений</strong> о проблеме по этому адресу.
              </div>
            )}
          </div>

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

          {/* Measures */}
          {incident.measuresTaken && incident.measuresTaken.length > 0 && (
            <div className="info-section">
              <div className="section-title">Принимаемые меры</div>
              <ul className="measures-bullet-list">
                {incident.measuresTaken.map((m, idx) => (
                  <li key={idx}>
                    <CheckCircle2 size={15} className="text-green" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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

          {/* Citizen confirmation */}
          <div className="feedback-section">
            <div className="section-title">У вас тоже нет света/воды поблизости?</div>
            {reportSuccess ? (
              <div className="success-feedback">
                Спасибо! Ваша отметка добавлена на карту SvetaNet.
              </div>
            ) : (
              <form onSubmit={handleSendExtra} className="feedback-form">
                <input
                  type="text"
                  placeholder="Укажите номер дома или соседнюю улицу..."
                  value={extraInfo}
                  onChange={(e) => setExtraInfo(e.target.value)}
                  className="feedback-input"
                />
                <button type="submit" className="feedback-submit">
                  <Send size={14} /> Подтвердить
                </button>
              </form>
            )}
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
