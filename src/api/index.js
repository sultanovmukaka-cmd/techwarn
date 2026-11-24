// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Storage helpers for Bearer token and current user
 */
export const getToken = () => localStorage.getItem('warntech_token');
export const setToken = (token) => {
  if (token) {
    localStorage.setItem('warntech_token', token);
  } else {
    localStorage.removeItem('warntech_token');
  }
};

export const getSavedUser = () => {
  try {
    const raw = localStorage.getItem('warntech_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setSavedUser = (user) => {
  if (user) {
    localStorage.setItem('warntech_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('warntech_user');
  }
};

/**
 * Generic request helper with automatic Authorization header
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
      // response is not JSON
    }
    const message = errorData.message || errorData.error || `HTTP error ${response.status}: ${response.statusText}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  // If CSV or Blob requested
  if (options.responseType === 'blob') {
    return response.blob();
  }

  return response.json();
}

/**
 * Normalizes an outage object from backend so the frontend handles it consistently
 */
export function normalizeOutage(raw) {
  if (!raw) return null;

  // Handle _id or id
  const id = raw._id || raw.id || `inc-${Math.random().toString(36).substr(2, 9)}`;

  // Handle coordinates (supports [lat, lng], [lng, lat], {lat, lng}, or location object)
  let coordinates = [41.3111, 69.2797];
  if (Array.isArray(raw.coordinates) && raw.coordinates.length >= 2) {
    // If coordinates are [lng, lat] GeoJSON format (lng > 60 for Tashkent, lat around 41)
    if (raw.coordinates[0] > 50 && raw.coordinates[1] < 50) {
      coordinates = [raw.coordinates[1], raw.coordinates[0]];
    } else {
      coordinates = [raw.coordinates[0], raw.coordinates[1]];
    }
  } else if (raw.location && Array.isArray(raw.location.coordinates)) {
    const [c1, c2] = raw.location.coordinates;
    if (c1 > 50) {
      coordinates = [c2, c1];
    } else {
      coordinates = [c1, c2];
    }
  } else if (raw.lat && raw.lng) {
    coordinates = [Number(raw.lat), Number(raw.lng)];
  }

  // Type normalization (electricity, water, gas)
  let type = 'electricity';
  const rawType = (raw.type || raw.service || raw.category || '').toLowerCase();
  if (rawType.includes('water') || rawType.includes('сув') || rawType.includes('вод')) {
    type = 'water';
  } else if (rawType.includes('gas') || rawType.includes('газ')) {
    type = 'gas';
  } else {
    type = 'electricity';
  }

  // Status normalization (active, in_progress, resolved)
  let status = 'active';
  const rawStatus = (raw.status || '').toLowerCase();
  if (rawStatus === 'resolved' || rawStatus === 'fixed' || rawStatus === 'включено' || rawStatus === 'ликвидировано') {
    status = 'resolved';
  } else if (rawStatus === 'in_progress' || rawStatus === 'progress' || rawStatus === 'в работе' || rawStatus === 'ремонт') {
    status = 'in_progress';
  } else {
    status = 'active';
  }

  return {
    _id: id,
    id: id,
    title: raw.title || `Отключение: ${raw.mahalla || raw.district || 'Ташкент'}`,
    type,
    status,
    severity: raw.severity || 'high',
    coordinates,
    district: raw.district || 'Юнусабадский',
    mahalla: raw.mahalla || raw.district || 'Махалля города Ташкент',
    address: raw.address || 'Адрес уточняется',
    description: raw.description || 'Аварийное или плановое отключение коммунальных услуг.',
    reportedAt: raw.reportedAt || raw.createdAt ? new Date(raw.reportedAt || raw.createdAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : '2026-11-24 11:00',
    estimatedResolution: raw.estimatedResolution || 'Сегодня к 18:00',
    affectedHouses: raw.affectedHouses || raw.housesCount || 1,
    affectedResidents: raw.affectedResidents || raw.residentsCount || 120,
    reportsCount: raw.confirmationsCount || raw.reportsCount || raw.confirmations?.length || 0,
    isConfirmedByCommunity: Boolean(raw.isConfirmed || (raw.confirmationsCount && raw.confirmationsCount > 3)),
    serviceTeam: raw.serviceTeam || raw.organization?.name || (type === 'electricity' ? 'РЭС Ташкента (1154)' : type === 'water' ? 'Тошкент шахар сув таъминоти (1055)' : 'Худудгаз Пойтахт (104)'),
    dispatcherContact: raw.dispatcherContact || raw.organization?.phone || (type === 'electricity' ? '1154' : type === 'water' ? '1055' : '104'),
    impactRadius: raw.impactRadius || raw.radius || 250,
    measuresTaken: raw.measuresTaken || ['Заявка зарегистрирована в системе'],
    raw,
  };
}

/**
 * Public Outages API
 */
export const api = {
  // GET /api/outages
  async getOutages() {
    const data = await request('/outages', { method: 'GET' });
    const list = Array.isArray(data) ? data : data.outages || data.data || [];
    return list.map(normalizeOutage);
  },

  // GET /api/outages/:id
  async getOutageById(id) {
    const data = await request(`/outages/${id}`, { method: 'GET' });
    const item = data.outage || data.data || data;
    return normalizeOutage(item);
  },

  // POST /api/outages
  async createOutage(outageData) {
    const payload = {
      title: outageData.title,
      type: outageData.type,
      district: outageData.district,
      mahalla: outageData.mahalla,
      address: outageData.address,
      description: outageData.description,
      coordinates: outageData.coordinates,
      severity: outageData.severity || 'high',
      status: outageData.status || 'active',
    };
    const res = await request('/outages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeOutage(res.outage || res.data || res);
  },

  // POST /api/outages/:id/confirm
  async confirmOutage(id) {
    const res = await request(`/outages/${id}/confirm`, {
      method: 'POST',
    });
    return res;
  },

  // PATCH /api/outages/:id/status
  async updateOutageStatus(id, newStatus) {
    const res = await request(`/outages/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    return normalizeOutage(res.outage || res.data || res);
  },

  /**
   * Authentication
   */
  // POST /api/auth/login
  async login(email, password) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const token = res.token || res.data?.token || res.accessToken;
    const user = res.user || res.data?.user || { email, role: email.includes('admin') ? 'admin' : email.includes('org') ? 'organization' : 'user' };

    if (token) {
      setToken(token);
      setSavedUser(user);
    }
    return { token, user };
  },

  // POST /api/auth/register
  async register(registerData) {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerData),
    });
    const token = res.token || res.data?.token || res.accessToken;
    const user = res.user || res.data?.user;
    if (token) {
      setToken(token);
      setSavedUser(user);
    }
    return { token, user };
  },

  // GET /api/auth/me
  async getMe() {
    const res = await request('/auth/me', { method: 'GET' });
    const user = res.user || res.data || res;
    setSavedUser(user);
    return user;
  },

  logout() {
    setToken(null);
    setSavedUser(null);
  },

  /**
   * Organization Endpoints (Role: org@netsveta.dev or admin@netsveta.dev)
   */
  // GET /api/organizations/dashboard
  async getOrgDashboard() {
    return request('/organizations/dashboard', { method: 'GET' });
  },

  // GET /api/organizations/outages
  async getOrgOutages() {
    const data = await request('/organizations/outages', { method: 'GET' });
    const list = Array.isArray(data) ? data : data.outages || data.data || [];
    return list.map(normalizeOutage);
  },

  // GET /api/organizations/export/csv
  async exportOrgCsv() {
    const blob = await request('/organizations/export/csv', {
      method: 'GET',
      responseType: 'blob',
    });
    // Trigger download in browser
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `outages_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * Admin Endpoints (Role: only admin@netsveta.dev)
   */
  // GET /api/admin/users
  async getAdminUsers() {
    const res = await request('/admin/users', { method: 'GET' });
    return Array.isArray(res) ? res : res.users || res.data || [];
  },

  // GET /api/admin/organizations
  async getAdminOrganizations() {
    const res = await request('/admin/organizations', { method: 'GET' });
    return Array.isArray(res) ? res : res.organizations || res.data || [];
  },

  // GET /api/admin/stats
  async getAdminStats() {
    return request('/admin/stats', { method: 'GET' });
  },
};
