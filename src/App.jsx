import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar/Navbar';
import StatsBanner from './components/Stats/StatsBanner';
import IncidentMap from './components/Map/IncidentMap';
import IncidentSidebar from './components/Sidebar/IncidentSidebar';
import IncidentModal from './components/Modal/IncidentModal';
import ReportIncidentModal from './components/Modal/ReportIncidentModal';
import AuthModal from './components/Modal/AuthModal';
import CabinetModal from './components/Modal/CabinetModal';
import { INITIAL_INCIDENTS, INCIDENT_TYPES, TASHKENT_DISTRICTS } from './data/incidents';
import { api, getSavedUser, normalizeOutage } from './api';
import './App.css';

export default function App() {
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [modalIncident, setModalIncident] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCabinetModalOpen, setIsCabinetModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auth User State
  const [user, setUser] = useState(getSavedUser());

  // API Connection State
  const [isApiOnline, setIsApiOnline] = useState(false);
  const [isFetchingApi, setIsFetchingApi] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState(TASHKENT_DISTRICTS[0]); // 'Все районы'

  // Fetch outages from GET /api/outages
  const loadOutagesFromApi = useCallback(async () => {
    setIsFetchingApi(true);
    try {
      const data = await api.getOutages();
      if (Array.isArray(data) && data.length > 0) {
        setIncidents(data);
      }
      setIsApiOnline(true);
    } catch (err) {
      console.warn('Backend API at http://localhost:4000/api/outages unreachable:', err.message);
      setIsApiOnline(false);
      // Keep initial/cached incidents so the map remains fully interactive
    } finally {
      setIsFetchingApi(false);
    }
  }, []);

  // Validate user with GET /api/auth/me if token exists
  useEffect(() => {
    loadOutagesFromApi();

    api.getMe()
      .then((me) => {
        setUser(me);
        setIsApiOnline(true);
      })
      .catch(() => {
        // Token might be expired or backend offline
      });
  }, [loadOutagesFromApi]);

  // Handle Citizen Confirmation (POST /api/outages/:id/confirm)
  const handleConfirmOutage = async (id) => {
    try {
      await api.confirmOutage(id);
    } catch (err) {
      console.warn('POST /confirm failed, incrementing locally:', err.message);
    }
    // Optimistically increment count in local state
    setIncidents((prev) =>
      prev.map((inc) => {
        const incId = inc._id || inc.id;
        if (incId === id) {
          const newCount = (inc.reportsCount || 0) + 1;
          const updated = { ...inc, reportsCount: newCount, isConfirmedByCommunity: true };
          if (modalIncident && (modalIncident._id === id || modalIncident.id === id)) {
            setModalIncident(updated);
          }
          return updated;
        }
        return inc;
      })
    );
  };

  // Handle Status Update (PATCH /api/outages/:id/status)
  const handleStatusChange = async (id, newStatus) => {
    try {
      const updated = await api.updateOutageStatus(id, newStatus);
      setIncidents((prev) =>
        prev.map((inc) => (inc._id === id || inc.id === id ? { ...inc, status: newStatus } : inc))
      );
      if (modalIncident && (modalIncident._id === id || modalIncident.id === id)) {
        setModalIncident((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.warn('PATCH status failed, updating locally:', err.message);
      setIncidents((prev) =>
        prev.map((inc) => (inc._id === id || inc.id === id ? { ...inc, status: newStatus } : inc))
      );
      if (modalIncident && (modalIncident._id === id || modalIncident.id === id)) {
        setModalIncident((prev) => ({ ...prev, status: newStatus }));
      }
    }
  };

  const handleAddIncident = (newIncident) => {
    const normalized = normalizeOutage(newIncident);
    setIncidents((prev) => [normalized, ...prev]);
    setSelectedIncident(normalized);
  };

  const handleSelectIncident = (inc) => {
    setSelectedIncident(inc);
  };

  const handleOpenDetails = (inc) => {
    setModalIncident(inc);
  };

  const handleFocusOnMap = (inc) => {
    setSelectedIncident(inc);
  };

  const handleAuthSuccess = (authUser) => {
    setUser(authUser);
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setIsCabinetModalOpen(false);
  };

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // District Filter
      if (selectedDistrict !== 'Все районы' && inc.district !== selectedDistrict) {
        return false;
      }

      // Type Filter
      if (filterType !== 'all' && inc.type !== filterType) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesAddress = inc.address?.toLowerCase().includes(q);
        const matchesMahalla = inc.mahalla ? inc.mahalla.toLowerCase().includes(q) : false;
        const matchesTitle = inc.title?.toLowerCase().includes(q);
        const matchesDistrict = inc.district?.toLowerCase().includes(q);

        if (!matchesAddress && !matchesMahalla && !matchesTitle && !matchesDistrict) {
          return false;
        }
      }

      return true;
    });
  }, [incidents, selectedDistrict, filterType, searchQuery]);

  return (
    <div className="svetanet-app">
      {/* Header with API Status and Auth */}
      <Navbar
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenCabinetModal={() => setIsCabinetModalOpen(true)}
        user={user}
        onLogout={handleLogout}
        isApiOnline={isApiOnline}
        onRefreshApi={loadOutagesFromApi}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* KPI Stats Bar */}
      <StatsBanner
        incidents={incidents}
        activeTypeFilter={filterType}
        onSelectTypeFilter={(t) => setFilterType(t)}
      />

      {/* Main Workspace: Sidebar & Tashkent Map */}
      <main className="svetanet-main-layout">
        <IncidentSidebar
          incidents={filteredIncidents}
          allIncidents={incidents}
          selectedIncident={selectedIncident}
          onSelectIncident={handleSelectIncident}
          onOpenDetails={handleOpenDetails}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={setSelectedDistrict}
          onConfirmOutage={handleConfirmOutage}
          onStatusChange={handleStatusChange}
          user={user}
          isOpen={isSidebarOpen}
        />

        <div className="map-container-area">
          <IncidentMap
            incidents={filteredIncidents}
            selectedIncident={selectedIncident}
            onSelectIncident={handleSelectIncident}
            onOpenDetails={handleOpenDetails}
            selectedDistrict={selectedDistrict}
          />
        </div>
      </main>

      {/* Details Modal */}
      {modalIncident && (
        <IncidentModal
          incident={modalIncident}
          onClose={() => setModalIncident(null)}
          onFocusOnMap={handleFocusOnMap}
          onConfirmOutage={handleConfirmOutage}
          onStatusChange={handleStatusChange}
          user={user}
        />
      )}

      {/* Citizen Report Modal (POST /api/outages) */}
      <ReportIncidentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onAddIncident={handleAddIncident}
      />

      {/* Auth Modal (POST /api/auth/login, POST /api/auth/register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Organization & Admin Cabinet Modal */}
      <CabinetModal
        isOpen={isCabinetModalOpen}
        onClose={() => setIsCabinetModalOpen(false)}
        user={user}
        onStatusChangeSuccess={(updated) => {
          setIncidents((prev) =>
            prev.map((i) => (i._id === updated._id || i.id === updated.id ? updated : i))
          );
        }}
      />
    </div>
  );
}
