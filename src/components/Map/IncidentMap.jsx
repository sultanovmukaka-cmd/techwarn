import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { INCIDENT_TYPES, INCIDENT_STATUSES } from '../../data/incidents';

// Tashkent Center coordinates
export const TASHKENT_CENTER = [41.3111, 69.2797];

// Clean SvetaNet-inspired markers
const createMarkerIcon = (type, status, reportsCount = 0, isSelected = false) => {
  let bgColor = '#f59e0b'; // Amber for electricity
  let glyph = '⚡';
  let typeLabel = 'Свет';

  if (type === INCIDENT_TYPES.WATER) {
    bgColor = '#0284c7'; // Blue for water
    glyph = '💧';
    typeLabel = 'Вода';
  } else if (type === INCIDENT_TYPES.GAS) {
    bgColor = '#ea580c'; // Orange for gas
    glyph = '🔥';
    typeLabel = 'Газ';
  } else if (type === INCIDENT_TYPES.ELECTRICITY) {
    bgColor = '#d97706';
    glyph = '⚡';
    typeLabel = 'Свет';
  }

  const isResolved = status === INCIDENT_STATUSES.RESOLVED;
  const pinBg = isResolved ? '#10b981' : bgColor;

  const html = `
    <div class="svetanet-marker ${isSelected ? 'marker-selected' : ''} ${isResolved ? 'is-resolved' : ''}">
      <div class="marker-bubble" style="background-color: ${pinBg};">
        <span class="marker-glyph">${glyph}</span>
        ${reportsCount > 10 ? `<span class="marker-badge">${reportsCount}</span>` : ''}
      </div>
      <div class="marker-arrow" style="border-top-color: ${pinBg};"></div>
      <div class="marker-caption">${typeLabel}</div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'svetanet-div-icon',
    iconSize: [40, 52],
    iconAnchor: [20, 50],
    popupAnchor: [0, -48],
  });
};

export default function IncidentMap({
  incidents,
  selectedIncident,
  onSelectIncident,
  onOpenDetails,
  selectedDistrict,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const circlesLayerRef = useRef(null);
  const markerMapRef = useRef(new Map());

  // Initialize Tashkent Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: TASHKENT_CENTER,
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Standard OpenStreetMap tiles (clean civic style)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap | WarnTech / SvetaNet Ташкент',
      maxZoom: 19,
    }).addTo(map);

    const circlesLayer = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    circlesLayerRef.current = circlesLayer;
    markersLayerRef.current = markersLayer;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync Markers and Outage Circles
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const circlesLayer = circlesLayerRef.current;

    if (!map || !markersLayer || !circlesLayer) return;

    markersLayer.clearLayers();
    circlesLayer.clearLayers();
    markerMapRef.current.clear();

    incidents.forEach((inc) => {
      const isSelected = selectedIncident && selectedIncident.id === inc.id;
      const icon = createMarkerIcon(inc.type, inc.status, inc.reportsCount, isSelected);

      const marker = L.marker(inc.coordinates, { icon });

      // Outage area circle
      let circleColor = '#f59e0b';
      if (inc.type === INCIDENT_TYPES.WATER) circleColor = '#0284c7';
      if (inc.type === INCIDENT_TYPES.GAS) circleColor = '#ea580c';
      if (inc.status === INCIDENT_STATUSES.RESOLVED) circleColor = '#10b981';

      const circle = L.circle(inc.coordinates, {
        radius: inc.impactRadius || 250,
        color: circleColor,
        weight: isSelected ? 2 : 1.2,
        opacity: isSelected ? 0.8 : 0.45,
        fillColor: circleColor,
        fillOpacity: isSelected ? 0.2 : 0.08,
        dashArray: inc.status === INCIDENT_STATUSES.RESOLVED ? '4, 4' : undefined,
      });
      circlesLayer.addLayer(circle);

      // Clean SvetaNet popup content
      const statusText =
        inc.status === INCIDENT_STATUSES.ACTIVE
          ? '<span class="status-pill pill-red">Отключено</span>'
          : inc.status === INCIDENT_STATUSES.IN_PROGRESS
          ? '<span class="status-pill pill-amber">Идут работы</span>'
          : '<span class="status-pill pill-green">Восстановлено</span>';

      const reportsHtml = inc.reportsCount
        ? `<div class="popup-reports">👥 <strong>${inc.reportsCount}</strong> жителей сообщили</div>`
        : '';

      const popupHtml = `
        <div class="svetanet-popup">
          <div class="popup-top">
            <span class="popup-district">${inc.district} р-н</span>
            ${statusText}
          </div>
          <h4 class="popup-title">${inc.title}</h4>
          <div class="popup-mahalla">📍 ${inc.mahalla}</div>
          <div class="popup-address">${inc.address}</div>
          ${reportsHtml}
          <div class="popup-time-row">
            <div>Отключено: <strong>${inc.reportedAt.split(' ')[1]}</strong></div>
            <div>Ориентир включения: <strong>${inc.estimatedResolution.split(' ')[1]}</strong></div>
          </div>
          <button class="popup-action-btn" id="popup-btn-${inc.id}">
            Подробнее и контакты РЭС/ГорГаз →
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'svetanet-leaflet-popup',
        maxWidth: 320,
        minWidth: 260,
      });

      marker.on('click', () => {
        onSelectIncident(inc);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${inc.id}`);
        if (btn) {
          btn.onclick = () => {
            onOpenDetails(inc);
          };
        }
      });

      markersLayer.addLayer(marker);
      markerMapRef.current.set(inc.id, marker);
    });
  }, [incidents, selectedIncident, onSelectIncident, onOpenDetails]);

  // Center on selected incident
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedIncident) return;

    const marker = markerMapRef.current.get(selectedIncident.id);
    map.flyTo(selectedIncident.coordinates, 15, {
      animate: true,
      duration: 1.0,
    });

    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 350);
    }
  }, [selectedIncident]);

  return (
    <div className="map-wrapper">
      <div ref={mapContainerRef} className="leaflet-map-element" />

      {/* Clean SvetaNet Legend */}
      <div className="svetanet-map-legend">
        <div className="legend-head">Отключения в Ташкенте</div>
        <div className="legend-row">
          <span className="dot dot-electricity">⚡</span>
          <span>Свет (электричество)</span>
        </div>
        <div className="legend-row">
          <span className="dot dot-water">💧</span>
          <span>Вода (холодная/ГВС)</span>
        </div>
        <div className="legend-row">
          <span className="dot dot-gas">🔥</span>
          <span>Газ (природный)</span>
        </div>
        <div className="legend-row">
          <span className="dot dot-resolved">✅</span>
          <span>Восстановлено</span>
        </div>
      </div>
    </div>
  );
}
