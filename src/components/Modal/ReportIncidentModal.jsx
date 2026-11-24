import React, { useState } from 'react';
import { X, CheckCircle2, Send, AlertTriangle } from 'lucide-react';
import { INCIDENT_TYPES, INCIDENT_STATUSES, TASHKENT_DISTRICTS } from '../../data/incidents';
import { api } from '../../api';

export default function ReportIncidentModal({ isOpen, onClose, onAddIncident }) {
  const [type, setType] = useState(INCIDENT_TYPES.ELECTRICITY);
  const [district, setDistrict] = useState(TASHKENT_DISTRICTS[1]); // 'Юнусабадский'
  const [mahalla, setMahalla] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [notice, setNotice] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim() || !mahalla.trim()) return;

    setLoading(true);
    setNotice(null);

    // Offset in Tashkent area
    const offsetLat = (Math.random() - 0.5) * 0.05;
    const offsetLng = (Math.random() - 0.5) * 0.05;
    const coords = [41.3111 + offsetLat, 69.2797 + offsetLng];

    const payload = {
      title: `Отключение: ${mahalla} (${type === INCIDENT_TYPES.ELECTRICITY ? 'Свет' : type === INCIDENT_TYPES.WATER ? 'Вода' : 'Газ'})`,
      type,
      district,
      mahalla,
      address,
      description: description || 'Сообщение зарегистрировано через общественный сервис SvetaNet.',
      coordinates: coords,
      severity: 'high',
      status: INCIDENT_STATUSES.ACTIVE,
    };

    try {
      // Send real POST /api/outages to the backend
      const created = await api.createOutage(payload);
      onAddIncident(created);
      setIsSuccess(true);
      setNotice('Авария успешно отправлена в API (POST /api/outages)');
    } catch (err) {
      console.warn('API create outage error:', err);
      // Fallback offline mode if backend is not reachable
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${timeStr}`;

      const fallbackItem = {
        _id: `tsh-${Date.now().toString().slice(-4)}`,
        id: `tsh-${Date.now().toString().slice(-4)}`,
        ...payload,
        reportedAt: dateStr,
        estimatedResolution: 'Сегодня к 18:30',
        affectedHouses: 5,
        affectedResidents: 1100,
        reportsCount: 1,
        isConfirmedByCommunity: true,
        serviceTeam: type === INCIDENT_TYPES.ELECTRICITY ? 'Районный РЭС г. Ташкента' : type === INCIDENT_TYPES.WATER ? 'ООО «Тошкент шахар сув таъминоти»' : 'Филиал «Худудгаз Пойтахт»',
        dispatcherContact: type === INCIDENT_TYPES.ELECTRICITY ? '1154' : type === INCIDENT_TYPES.WATER ? '1055' : '104',
        impactRadius: 250,
      };

      onAddIncident(fallbackItem);
      setIsSuccess(true);
      setNotice('API офлайн: сохранено локально на карте.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setIsSuccess(false);
        setNotice(null);
        onClose();
        setMahalla('');
        setAddress('');
        setDescription('');
      }, 1800);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="svetanet-modal report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <div>
            <div className="modal-category">POST /api/outages</div>
            <h3 className="modal-heading">Сообщить об отключении в Ташкенте</h3>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div className="report-success-view">
            <CheckCircle2 size={50} className="text-green" />
            <h4>Спасибо за информацию!</h4>
            <p>{notice || 'Отметка отключения добавлена на карту Ташкента.'}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="report-form-body">
            {/* Type selector */}
            <div className="form-field">
              <label className="field-label">Что именно отключили? *</label>
              <div className="type-buttons-group">
                <button
                  type="button"
                  className={`choice-btn ${type === INCIDENT_TYPES.ELECTRICITY ? 'active electricity' : ''}`}
                  onClick={() => setType(INCIDENT_TYPES.ELECTRICITY)}
                >
                  ⚡ Свет (Электричество)
                </button>
                <button
                  type="button"
                  className={`choice-btn ${type === INCIDENT_TYPES.WATER ? 'active water' : ''}`}
                  onClick={() => setType(INCIDENT_TYPES.WATER)}
                >
                  💧 Вода (Сув)
                </button>
                <button
                  type="button"
                  className={`choice-btn ${type === INCIDENT_TYPES.GAS ? 'active gas' : ''}`}
                  onClick={() => setType(INCIDENT_TYPES.GAS)}
                >
                  🔥 Газ
                </button>
              </div>
            </div>

            {/* District select */}
            <div className="form-field">
              <label className="field-label">Район Ташкента *</label>
              <select
                className="input-select"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              >
                {TASHKENT_DISTRICTS.filter((d) => d !== 'Все районы').map((d) => (
                  <option key={d} value={d}>
                    {d} район
                  </option>
                ))}
              </select>
            </div>

            {/* Mahalla */}
            <div className="form-field">
              <label className="field-label">Махалля / Массив / Квартал *</label>
              <input
                type="text"
                required
                className="input-text"
                placeholder="Например: махалля Чапаната / Юнусабад 11-й квартал"
                value={mahalla}
                onChange={(e) => setMahalla(e.target.value)}
              />
            </div>

            {/* Address */}
            <div className="form-field">
              <label className="field-label">Улица, дом, ориентир *</label>
              <input
                type="text"
                required
                className="input-text"
                placeholder="ул. Катартал, д. 15, возле супермаркета Korzinka"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="form-field">
              <label className="field-label">Подробности (необязательно)</label>
              <textarea
                className="input-textarea"
                rows="2"
                placeholder="Света нет во всем доме или только в подъезде, есть ли запах газа..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="modal-bottom">
              <button type="button" className="btn-close" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                <Send size={15} />
                <span>{loading ? 'Отправка в API...' : 'Отправить в систему'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
