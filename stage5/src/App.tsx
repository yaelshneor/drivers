/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Bus, 
  User, 
  LogOut, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Check, 
  X, 
  AlertCircle,
  MapPin,
  Clock,
  Phone,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  BarChart2,
  PieChart,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Driver, Trip, TripAssignment, BusOption, RouteOption, RouteCreateInput, RegionOption, SiteOption, StopOption } from './types';
import {
  fetchDriverById,
  fetchDrivers,
  createDriver,
  updateDriverApi,
  deleteDriverApi,
} from './api/drivers';
import { LICENSE_TYPES } from './constants/licenseTypes';
import { fetchBuses } from './api/buses';
import { fetchRoutes, createRoute } from './api/routes';
import { fetchRegions, fetchSites, fetchStops } from './api/catalog';
import { fetchTrips, createTrip, updateTripStatus } from './api/trips';
import { ApiError } from './api/client';

type View = 'login' | 'driver' | 'manager';
type ManagerTab = 'drivers' | 'routes' | 'schedule' | 'requests';
type DriverViewMode = 'list' | 'calendar' | 'stats';

export default function App() {
  const [view, setView] = useState<View>('login');
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [managerTab, setManagerTab] = useState<ManagerTab>('drivers');
  const [driverViewMode, setDriverViewMode] = useState<DriverViewMode>('list');
  const [managerScheduleMode, setManagerScheduleMode] = useState<DriverViewMode>('list');
  
  // Forms state
  const [isDriverFormOpen, setIsDriverFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [isRouteFormOpen, setIsRouteFormOpen] = useState(false);
  const [selectedTripDetails, setSelectedTripDetails] = useState<Trip | null>(null);
  const [selectedDriverDetails, setSelectedDriverDetails] = useState<Driver | null>(null);

  const patchTrip = (updated: Trip) => {
    setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTripDetails((prev) => (prev?.id === updated.id ? updated : prev));
  };

  const handleDriverLogin = async (id: string) => {
    if (!id.trim()) {
      alert('יש להזין מזהה נהג');
      return;
    }
    try {
      const [driver, driverTrips] = await Promise.all([
        fetchDriverById(id.trim()),
        fetchTrips(id.trim()),
      ]);
      setCurrentDriver(driver);
      setTrips(driverTrips);
      setView('driver');
      setDriverViewMode('list');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        alert('מזהה נהג לא נמצא');
      } else {
        alert('שגיאה בחיבור לשרת — ודאי שה-API וה-DB פעילים');
      }
    }
  };

  const handleManagerLogin = async () => {
    try {
      const [driversData, tripsData, routesData] = await Promise.all([
        fetchDrivers(),
        fetchTrips(),
        fetchRoutes(),
      ]);
      setDrivers(driversData);
      setTrips(tripsData);
      setRoutes(routesData);
      setView('manager');
    } catch {
      alert('שגיאה בחיבור לשרת — ודאי שה-API וה-DB פעילים');
    }
  };

  const handleLogout = () => {
    setView('login');
    setCurrentDriver(null);
    setTrips([]);
    setDrivers([]);
    setRoutes([]);
  };

  const addDriver = async (driver: Driver) => {
    try {
      const created = await createDriver(driver);
      setDrivers((prev) => [...prev, created]);
      setIsDriverFormOpen(false);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'שגיאה בהוספת נהג');
    }
  };

  const updateDriver = async (updatedDriver: Driver) => {
    try {
      const saved = await updateDriverApi(updatedDriver);
      setDrivers((prev) => prev.map((d) => (d.id === saved.id ? saved : d)));
      setEditingDriver(null);
      setIsDriverFormOpen(false);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'שגיאה בעדכון נהג');
    }
  };

  const deleteDriver = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק נהג זה?')) return;
    try {
      await deleteDriverApi(id);
      setDrivers((prev) => prev.filter((d) => d.id !== id));
      setTrips((prev) => prev.filter((t) => t.driverId !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'שגיאה במחיקת נהג');
    }
  };

  const assignTrip = async (data: TripAssignment) => {
    try {
      const created = await createTrip(data);
      setTrips((prev) => [...prev, created]);
      setIsAssignmentFormOpen(false);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'שגיאה בשיבוץ נסיעה');
    }
  };

  const addRoute = async (data: RouteCreateInput) => {
    try {
      const created = await createRoute(data);
      setRoutes((prev) => [created, ...prev]);
      setIsRouteFormOpen(false);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'שגיאה ביצירת מסלול');
    }
  };

  const requestCancellation = async (tripId: string) => {
    try {
      const updated = await updateTripStatus(tripId, 'pending_cancellation');
      patchTrip(updated);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'שגיאה בבקשת ביטול');
    }
  };

  const handleCancellationResponse = async (tripId: string, approve: boolean) => {
    try {
      const updated = await updateTripStatus(
        tripId,
        approve ? 'cancelled' : 'cancellation_rejected',
      );
      patchTrip(updated);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'שגיאה בעדכון בקשה');
    }
  };

  const acknowledgeRejection = async (tripId: string) => {
    try {
      const updated = await updateTripStatus(tripId, 'scheduled');
      patchTrip(updated);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'שגיאה בעדכון סטטוס');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900" dir="rtl">
      <AnimatePresence mode="wait">
        {view === 'login' && (
          <LoginScreen onLogin={handleDriverLogin} onManagerLogin={handleManagerLogin} />
        )}
        
        {view === 'driver' && currentDriver && (
          <DriverDashboard 
            driver={currentDriver} 
            trips={trips.filter(t => t.driverId === currentDriver.id)} 
            onLogout={handleLogout}
            onRequestCancellation={requestCancellation}
            viewMode={driverViewMode}
            setViewMode={setDriverViewMode}
            onSelectTrip={setSelectedTripDetails}
            onAcknowledgeRejection={acknowledgeRejection}
          />
        )}

        {view === 'manager' && (
          <ManagerDashboard 
            drivers={drivers}
            trips={trips}
            routes={routes}
            activeTab={managerTab}
            setActiveTab={setManagerTab}
            onLogout={handleLogout}
            onAddDriver={() => { setEditingDriver(null); setIsDriverFormOpen(true); }}
            onEditDriver={(d) => { setEditingDriver(d); setIsDriverFormOpen(true); }}
            onDeleteDriver={deleteDriver}
            onAddRoute={() => setIsRouteFormOpen(true)}
            onAssignTrip={() => setIsAssignmentFormOpen(true)}
            onCancellationResponse={handleCancellationResponse}
            scheduleMode={managerScheduleMode}
            setScheduleMode={setManagerScheduleMode}
            onSelectTrip={setSelectedTripDetails}
            onSelectDriver={setSelectedDriverDetails}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      {isDriverFormOpen && (
        <DriverFormModal 
          driver={editingDriver} 
          onClose={() => setIsDriverFormOpen(false)} 
          onSave={editingDriver ? updateDriver : addDriver} 
        />
      )}

      {isAssignmentFormOpen && (
        <AssignmentFormModal 
          drivers={drivers}
          onClose={() => setIsAssignmentFormOpen(false)} 
          onSave={assignTrip} 
        />
      )}

      {isRouteFormOpen && (
        <RouteFormModal
          onClose={() => setIsRouteFormOpen(false)}
          onSave={addRoute}
        />
      )}

      {selectedTripDetails && (
        <TripDetailsModal 
          trip={selectedTripDetails} 
          onClose={() => setSelectedTripDetails(null)} 
          onRequestCancellation={() => requestCancellation(selectedTripDetails.id)}
          isManagerView={view === 'manager'}
          driverName={drivers.find(d => d.id === selectedTripDetails.driverId)?.name}
          onAcknowledgeRejection={acknowledgeRejection}
        />
      )}

      {selectedDriverDetails && (
        <DriverDetailsModal 
          driver={selectedDriverDetails} 
          trips={trips.filter(t => t.driverId === selectedDriverDetails.id)}
          onClose={() => setSelectedDriverDetails(null)} 
        />
      )}
    </div>
  );
}

// --- Screens ---

function LoginScreen({ onLogin, onManagerLogin }: { onLogin: (id: string) => void, onManagerLogin: () => void }) {
  const [id, setId] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-screen p-4"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-600 rounded-full text-white">
            <Bus size={40} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">מערכת ניהול נהגים</h1>
        <p className="text-slate-500 text-center mb-8">אנא הכנס מזהה נהג כדי להמשיך</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">מזהה נהג (ID)</label>
            <input 
              type="text" 
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="לדוגמה: 1001"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => onLogin(id)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-200"
          >
            כניסת נהג
          </button>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-500">או</span></div>
          </div>
          
          <button 
            onClick={onManagerLogin}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Users size={20} />
            כניסת מנהל
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function DriverDashboard({ 
  driver, 
  trips, 
  onLogout, 
  onRequestCancellation,
  viewMode,
  setViewMode,
  onSelectTrip,
  onAcknowledgeRejection
}: { 
  driver: Driver, 
  trips: Trip[], 
  onLogout: () => void,
  onRequestCancellation: (id: string) => void,
  viewMode: DriverViewMode,
  setViewMode: (mode: DriverViewMode) => void,
  onSelectTrip: (trip: Trip) => void,
  onAcknowledgeRejection: (id: string) => void
}) {
  const rejectedTrips = trips.filter(t => t.status === 'cancellation_rejected');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-4 md:p-8"
    >
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">שלום, {driver.name}</h1>
          <p className="text-slate-500">מזהה: {driver.id} | רישיון: {driver.licensetype}</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
            title="התנתק"
          >
            <LogOut size={24} />
          </button>
        </div>
      </header>

      <section className="space-y-6">
        {viewMode === 'list' && (
          <div className="grid grid-cols-2 gap-4 mb-2">
            <button 
              onClick={() => setViewMode('calendar')}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center gap-2 text-slate-700 font-bold"
            >
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <Calendar size={24} />
              </div>
              לוח שנה
            </button>
            <button 
              onClick={() => setViewMode('stats')}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center gap-2 text-slate-700 font-bold"
            >
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <BarChart2 size={24} />
              </div>
              סיכום נסיעות
            </button>
          </div>
        )}

        {viewMode !== 'list' && (
          <button 
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all w-fit"
          >
            <ChevronRight size={20} />
            חזרה לרשימה
          </button>
        )}
        {rejectedTrips.map(trip => (
          <div key={`alert-${trip.id}`} className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 text-red-600 rounded-full">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-red-800 font-bold">בקשת ביטול נדחתה: {trip.destination}</h3>
                <p className="text-red-700 text-sm">המנהל דחה את בקשת הביטול שלך לנסיעה ב-{trip.date} בשעה {trip.time}.</p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => onSelectTrip(trip)}
                className="flex-1 md:flex-none bg-white border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
              >
                צפה בנסיעה
              </button>
              <button 
                onClick={() => onAcknowledgeRejection(trip.id)}
                className="flex-1 md:flex-none bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
              >
                אישור
              </button>
            </div>
          </div>
        ))}

        <h2 className="text-xl font-semibold flex items-center gap-2">
          {viewMode === 'stats' ? <BarChart2 className="text-indigo-600" /> : <Calendar className="text-indigo-600" />}
          {viewMode === 'list' ? 'רשימת הנסיעות שלך' : viewMode === 'calendar' ? 'לוח הנסיעות שלך' : 'סיכום וסטטיסטיקה'}
        </h2>
        
        {trips.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
            <p className="text-slate-500">אין נסיעות מתוכננות כרגע</p>
          </div>
        ) : (
          viewMode === 'list' ? (
            <div className="grid gap-4">
              {trips.map(trip => (
                <div key={trip.id}>
                  <TripCard 
                    trip={trip} 
                    isDriverView={true} 
                    onRequestCancellation={() => onRequestCancellation(trip.id)} 
                    onSelect={() => onSelectTrip(trip)}
                  />
                </div>
              ))}
            </div>
          ) : viewMode === 'calendar' ? (
            <CalendarView trips={trips} onSelectTrip={onSelectTrip} />
          ) : (
            <DriverStatsView trips={trips} />
          )
        )}
      </section>
    </motion.div>
  );
}

function CalendarView({ 
  trips, 
  onSelectTrip, 
  isManagerView = false, 
  drivers = [] 
}: { 
  trips: Trip[], 
  onSelectTrip: (trip: Trip) => void,
  isManagerView?: boolean,
  drivers?: Driver[]
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthNames = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
  const dayNames = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getTripsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return trips.filter(t => t.date === dateStr);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-3xl mx-auto">
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-bold text-base">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
        <div className="flex gap-2" dir="ltr">
          <button onClick={prevMonth} className="p-1.5 hover:bg-white rounded-lg border border-slate-200 transition-all"><ChevronLeft size={16} /></button>
          <button onClick={nextMonth} className="p-1.5 hover:bg-white rounded-lg border border-slate-200 transition-all"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-100">
        {dayNames.map(day => (
          <div key={day} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[60px] border-b border-l border-slate-50 bg-slate-50/30"></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayTrips = getTripsForDay(day);
          return (
            <div key={day} className="min-h-[60px] border-b border-l border-slate-100 p-1 relative group hover:bg-slate-50 transition-all">
              <span className="text-xs font-medium text-slate-400">{day}</span>
              <div className="mt-0.5 space-y-0.5">
                {dayTrips.map(trip => (
                  <button 
                    key={trip.id}
                    onClick={() => onSelectTrip(trip)}
                    className={`w-full text-right px-1.5 py-0.5 rounded text-[9px] font-bold truncate transition-all ${
                      trip.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                      trip.status === 'pending_cancellation' ? 'bg-amber-100 text-amber-700' : 
                      trip.status === 'cancellation_rejected' ? 'bg-red-100 text-red-700 border border-red-300' :
                      'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                    title={`${trip.time} - ${trip.destination}${isManagerView ? ` (${drivers.find(d => d.id === trip.driverId)?.name || trip.driverId})` : ''}`}
                  >
                    {trip.time} - {trip.destination}
                    {isManagerView && (
                      <span className="block opacity-70 text-[8px] font-normal">
                        {drivers.find(d => d.id === trip.driverId)?.name || trip.driverId}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TripDetailsModal({ 
  trip, 
  onClose, 
  onRequestCancellation,
  isManagerView = false,
  driverName,
  onAcknowledgeRejection
}: { 
  trip: Trip, 
  onClose: () => void, 
  onRequestCancellation: () => void,
  isManagerView?: boolean,
  driverName?: string,
  onAcknowledgeRejection?: (id: string) => void
}) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xl font-bold">פרטי נסיעה</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X /></button>
        </div>
        <div className="p-6 space-y-4">
          {trip.status === 'cancellation_rejected' && !isManagerView && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-pulse">
              <AlertCircle className="text-red-600 shrink-0" size={20} />
              <div>
                <h4 className="text-red-800 font-bold text-sm">בקשת הביטול נדחתה</h4>
                <p className="text-red-700 text-xs mt-1">המנהל דחה את בקשת הביטול שלך לנסיעה זו. עליך לבצע את הנסיעה כמתוכנן.</p>
              </div>
            </div>
          )}
          <TripCard 
            trip={trip} 
            isDriverView={!isManagerView} 
            onRequestCancellation={onRequestCancellation}
            driverName={driverName}
          />
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          {trip.status === 'cancellation_rejected' && !isManagerView && onAcknowledgeRejection && (
            <button 
              onClick={() => {
                onAcknowledgeRejection(trip.id);
                onClose();
              }} 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-red-100"
            >
              אישור והבנתי
            </button>
          )}
          <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100">
            סגור
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ManagerDashboard({ 
  drivers, 
  trips,
  routes,
  activeTab, 
  setActiveTab, 
  onLogout,
  onAddDriver,
  onEditDriver,
  onDeleteDriver,
  onAddRoute,
  onAssignTrip,
  onCancellationResponse,
  scheduleMode,
  setScheduleMode,
  onSelectTrip,
  onSelectDriver
}: { 
  drivers: Driver[], 
  trips: Trip[],
  routes: RouteOption[],
  activeTab: ManagerTab,
  setActiveTab: (tab: ManagerTab) => void,
  onLogout: () => void,
  onAddDriver: () => void,
  onEditDriver: (d: Driver) => void,
  onDeleteDriver: (id: string) => void,
  onAddRoute: () => void,
  onAssignTrip: () => void,
  onCancellationResponse: (id: string, approve: boolean) => void,
  scheduleMode: DriverViewMode,
  setScheduleMode: (mode: DriverViewMode) => void,
  onSelectTrip: (trip: Trip) => void,
  onSelectDriver: (driver: Driver) => void
}) {
  const pendingRequests = trips.filter(t => t.status === 'pending_cancellation');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-screen"
    >
      <nav className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <Bus />
            <span>ניהול מערך נהגים</span>
          </div>
          <div className="hidden md:flex gap-1">
            <TabButton active={activeTab === 'drivers'} onClick={() => setActiveTab('drivers')} icon={<Users size={18} />} label="נהגים" />
            <TabButton active={activeTab === 'routes'} onClick={() => setActiveTab('routes')} icon={<MapPin size={18} />} label="מסלולים" />
            <TabButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={<Calendar size={18} />} label="לוח נסיעות" />
            <TabButton 
              active={activeTab === 'requests'} 
              onClick={() => setActiveTab('requests')} 
              icon={<AlertCircle size={18} />} 
              label="בקשות ביטול" 
              badge={pendingRequests.length > 0 ? pendingRequests.length : undefined}
            />
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors">
          <span className="hidden sm:inline">התנתק</span>
          <LogOut size={20} />
        </button>
      </nav>

      {/* Mobile Tabs */}
      <div className="md:hidden flex border-b border-slate-200 bg-white">
        <TabButton active={activeTab === 'drivers'} onClick={() => setActiveTab('drivers')} icon={<Users size={18} />} label="נהגים" className="flex-1" />
        <TabButton active={activeTab === 'routes'} onClick={() => setActiveTab('routes')} icon={<MapPin size={18} />} label="מסלולים" className="flex-1" />
        <TabButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={<Calendar size={18} />} label="לוז" className="flex-1" />
        <TabButton active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} icon={<AlertCircle size={18} />} label="בקשות" className="flex-1" badge={pendingRequests.length > 0 ? pendingRequests.length : undefined} />
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'drivers' && (
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">ניהול נהגים</h2>
                <button 
                  onClick={onAddDriver}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-md"
                >
                  <Plus size={20} />
                  הוספת נהג
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-600">שם נהג</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">ID</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">טלפון</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">סוג רישיון</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {drivers.map(driver => {
                      const hasTrips = trips.some((t) => t.driverId === driver.id);
                      return (
                      <tr key={driver.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium">{driver.name}</td>
                        <td className="px-6 py-4 text-slate-500">{driver.id}</td>
                        <td className="px-6 py-4 text-slate-500">{driver.phone}</td>
                        <td className="px-6 py-4 text-slate-500">{driver.licensetype}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => onSelectDriver(driver)}
                              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all" 
                              title="צפייה"
                            >
                              <Eye size={18} />
                            </button>
                            <button onClick={() => onEditDriver(driver)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="ערוך"><Edit2 size={18} /></button>
                            <button
                              onClick={() => !hasTrips && onDeleteDriver(driver.id)}
                              disabled={hasTrips}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                              title={hasTrips ? 'לא ניתן למחוק נהג עם נסיעות משויכות' : 'מחק'}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'routes' && (
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">ניהול מסלולים</h2>
                <button
                  onClick={onAddRoute}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-md"
                >
                  <Plus size={20} />
                  מסלול חדש
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-600">שם מסלול</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">יציאה → יעד</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">אזור</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">משך</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">מרחק</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">תחנות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {routes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">אין מסלולים — צרי מסלול חדש</td>
                      </tr>
                    ) : routes.map((route) => (
                      <tr key={route.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium">{route.name}</td>
                        <td className="px-6 py-4 text-slate-500">{route.startLocation} → {route.endLocation}</td>
                        <td className="px-6 py-4 text-slate-500">{route.regionName}</td>
                        <td className="px-6 py-4 text-slate-500">{route.durationMinutes} דק&apos;</td>
                        <td className="px-6 py-4 text-slate-500">{route.distanceKm} ק&quot;מ</td>
                        <td className="px-6 py-4 text-slate-500">{route.stops.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'schedule' && (
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">לוח נסיעות כללי</h2>
                <div className="flex items-center gap-4">
                  <div className="bg-white p-1 rounded-xl border border-slate-200 flex">
                    <button 
                      onClick={() => setScheduleMode('list')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${scheduleMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      רשימה
                    </button>
                    <button 
                      onClick={() => setScheduleMode('calendar')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${scheduleMode === 'calendar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      לוח שנה
                    </button>
                  </div>
                  <button 
                    onClick={onAssignTrip}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-md"
                  >
                    <Plus size={20} />
                    שיבוץ נסיעה
                  </button>
                </div>
              </div>
              
              {scheduleMode === 'list' ? (
                <div className="grid gap-4">
                  {trips.map(trip => (
                    <div key={trip.id}>
                      <TripCard 
                        trip={trip} 
                        isDriverView={false} 
                        driverName={drivers.find(d => d.id === trip.driverId)?.name}
                        onSelect={() => onSelectTrip(trip)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <CalendarView trips={trips} onSelectTrip={onSelectTrip} isManagerView={true} drivers={drivers} />
              )}
            </section>
          )}

          {activeTab === 'requests' && (
            <section>
              <h2 className="text-2xl font-bold mb-6">בקשות ביטול נסיעה</h2>
              {pendingRequests.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
                  <p className="text-slate-500">אין בקשות ביטול ממתינות</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingRequests.map(trip => (
                    <div key={trip.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full uppercase">ממתין לאישור</span>
                          <h3 className="font-bold text-lg">{trip.destination}</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 text-sm text-slate-500">
                          <div className="flex items-center gap-2"><Calendar size={14} /> {trip.date}</div>
                          <div className="flex items-center gap-2"><Clock size={14} /> {trip.time}</div>
                          <div className="flex items-center gap-2"><User size={14} /> {drivers.find(d => d.id === trip.driverId)?.name}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button 
                          onClick={() => onCancellationResponse(trip.id, true)}
                          className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                          <Check size={18} />
                          אשר ביטול
                        </button>
                        <button 
                          onClick={() => onCancellationResponse(trip.id, false)}
                          className="flex-1 md:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                          <X size={18} />
                          דחה בקשה
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </motion.div>
  );
}

// --- Components ---

function TabButton({ active, onClick, icon, label, badge, className = "" }: { 
  active: boolean, 
  onClick: () => void, 
  icon: React.ReactNode, 
  label: string,
  badge?: number,
  className?: string
}) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all relative ${
        active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
      } ${className}`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
          {badge}
        </span>
      )}
    </button>
  );
}

interface TripCardProps {
  trip: Trip;
  isDriverView: boolean;
  onRequestCancellation?: () => void;
  driverName?: string;
  onSelect?: () => void;
}

function StopsSection({ stops }: { stops: string[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!stops.length) {
    return <p className="text-slate-400 text-sm">אין תחנות</p>;
  }
  return (
    <div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        {expanded ? <ChevronLeft size={16} className="rotate-90" /> : <ChevronLeft size={16} className="-rotate-90" />}
        <span>{stops.length} תחנות</span>
        <span className="text-slate-400 font-normal">{expanded ? '· הסתר' : '· הצג הכל'}</span>
      </button>
      {expanded && (
        <ol className="mt-2 space-y-1 max-h-48 overflow-y-auto">
          {stops.map((stop, i) => (
            <li key={i} className="text-xs text-slate-600 bg-slate-50 px-2 py-1.5 rounded-md">
              {i + 1}. {stop}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function TripCard({ trip, isDriverView, onRequestCancellation, driverName, onSelect }: TripCardProps) {
  const getStatusStyle = () => {
    switch (trip.status) {
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'pending_cancellation': return 'bg-amber-100 text-amber-700';
      case 'cancellation_rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-emerald-100 text-emerald-700';
    }
  };

  const getStatusLabel = () => {
    switch (trip.status) {
      case 'cancelled': return 'מבוטל';
      case 'pending_cancellation': return 'ממתין לביטול';
      case 'cancellation_rejected': return 'בקשת ביטול נדחתה';
      default: return 'מתוכנן';
    }
  };

  return (
    <div 
      onClick={onSelect}
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md cursor-pointer ${trip.status === 'cancelled' ? 'opacity-60' : ''}`}
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Bus size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">{trip.destination}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={14} />
                <span>יציאה מ: {trip.departureStation}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 ${getStatusStyle()}`}>
              {trip.status === 'cancellation_rejected' && <AlertCircle size={14} />}
              {trip.status === 'pending_cancellation' && <Clock size={14} />}
              {trip.status === 'cancelled' && <X size={14} />}
              {trip.status === 'scheduled' && <Check size={14} />}
              {getStatusLabel()}
            </span>
            <div className="flex items-center gap-4 font-medium">
              <div className="flex items-center gap-1"><Calendar size={16} className="text-slate-400" /> {trip.date}</div>
              <div className="flex items-center gap-1"><Clock size={16} className="text-slate-400" /> {trip.time}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">מסלול</span>
            <p className="text-slate-700 font-medium">{trip.route}</p>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">תחנות</span>
            <StopsSection stops={trip.stops} />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">פרטי רכב</span>
            <div className="flex items-center gap-2 text-slate-700">
              <CreditCard size={16} className="text-slate-400" />
              <span>{trip.busId}</span>
              {!isDriverView && driverName && (
                <span className="text-indigo-600 font-semibold mr-2 flex items-center gap-1">
                  <User size={14} />
                  {driverName}
                </span>
              )}
            </div>
          </div>
        </div>

        {isDriverView && trip.status === 'scheduled' && (
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRequestCancellation();
              }}
              className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
            >
              <AlertCircle size={18} />
              בקשת ביטול ננסיעה
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DriverStatsView({ trips }: { trips: Trip[] }) {
  const statsByMonth = trips.reduce((acc, trip) => {
    const month = trip.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { total: 0, completed: 0, cancelled: 0, pending: 0 };
    }
    acc[month].total++;
    if (trip.status === 'cancelled') acc[month].cancelled++;
    else if (trip.status === 'pending_cancellation') acc[month].pending++;
    else acc[month].completed++;
    return acc;
  }, {} as Record<string, { total: number, completed: number, cancelled: number, pending: number }>);

  const months = Object.keys(statsByMonth).sort().reverse();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Bus size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase">סה"כ נסיעות</span>
          </div>
          <p className="text-3xl font-bold">{trips.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Check size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase">בוצעו / מתוכננות</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            {trips.filter(t => t.status === 'scheduled' || t.status === 'cancellation_rejected').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <X size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase">בוטלו</span>
          </div>
          <p className="text-3xl font-bold text-red-600">
            {trips.filter(t => t.status === 'cancelled').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-600" />
            פירוט לפי חודשים
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">חודש</th>
                <th className="px-6 py-4">סה"כ</th>
                <th className="px-6 py-4">בוצעו</th>
                <th className="px-6 py-4">בוטלו</th>
                <th className="px-6 py-4">ממתין לביטול</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {months.map(month => (
                <tr key={month} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">{month}</td>
                  <td className="px-6 py-4">{statsByMonth[month].total}</td>
                  <td className="px-6 py-4 text-emerald-600 font-medium">{statsByMonth[month].completed}</td>
                  <td className="px-6 py-4 text-red-600 font-medium">{statsByMonth[month].cancelled}</td>
                  <td className="px-6 py-4 text-amber-600 font-medium">{statsByMonth[month].pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DriverFormModal({ driver, onClose, onSave }: { driver: Driver | null, onClose: () => void, onSave: (d: Driver) => void }) {
  const [formData, setFormData] = useState<Driver>(driver || {
    id: '',
    name: '',
    phone: '',
    licensetype: '',
  });

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xl font-bold">{driver ? 'עריכת נהג' : 'הוספת נהג חדש'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">שם מלא</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">מזהה (ID)</label>
              <input 
                type="text" 
                value={formData.id}
                disabled={!!driver}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">מספר טלפון</label>
            <input 
              type="text" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">סוג רישיון</label>
            <select
              value={formData.licensetype}
              onChange={(e) => setFormData({ ...formData, licensetype: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">בחר סוג רישיון...</option>
              {LICENSE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium">ביטול</button>
          <button 
            onClick={() => formData.name && formData.id && formData.licensetype && onSave(formData)}
            disabled={!formData.name || !formData.id || !formData.licensetype}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100"
          >
            שמור נהג
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DriverDetailsModal({ driver, trips, onClose }: { driver: Driver, trips: Trip[], onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xl font-bold">פרטי נהג: {driver.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X /></button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">מזהה</span>
              <span className="font-medium">{driver.id}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">טלפון</span>
              <span className="font-medium">{driver.phone}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">סוג רישיון</span>
              <span className="font-medium">{driver.licensetype}</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" />
              נסיעות משויכות ({trips.length})
            </h4>
            {trips.length === 0 ? (
              <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">אין נסיעות משויכות לנהג זה</p>
            ) : (
              <div className="space-y-3">
                {trips.map(trip => (
                  <div key={trip.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <div>
                      <div className="font-bold">{trip.destination}</div>
                      <div className="text-xs text-slate-500">{trip.date} | {trip.time}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                      trip.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                      trip.status === 'pending_cancellation' ? 'bg-amber-100 text-amber-700' : 
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {trip.status === 'cancelled' ? 'מבוטל' : trip.status === 'pending_cancellation' ? 'ממתין' : 'מתוכנן'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100">
            סגור
          </button>
        </div>
      </motion.div>
    </div>
  );
}

type StopFormRow = {
  mode: 'existing' | 'new';
  stopId: string;
  stopName: string;
  address: string;
  latitude: string;
  longitude: string;
  siteName: string;
  arrivalTime: string;
};

function RouteFormModal({ onClose, onSave }: { onClose: () => void, onSave: (data: RouteCreateInput) => void }) {
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [stops, setStops] = useState<StopOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    routeName: '',
    startLocation: '',
    endLocation: '',
    durationMinutes: '',
    distanceKm: '',
    regionId: '',
  });
  const [stopRows, setStopRows] = useState<StopFormRow[]>([{
    mode: 'existing',
    stopId: '',
    stopName: '',
    address: '',
    latitude: '',
    longitude: '',
    siteName: '',
    arrivalTime: '',
  }]);

  useEffect(() => {
    Promise.all([fetchRegions(), fetchSites(), fetchStops()])
      .then(([r, s, st]) => { setRegions(r); setSites(s); setStops(st); })
      .catch(() => alert('שגיאה בטעינת נתונים'))
      .finally(() => setLoading(false));
  }, []);

  const addStopRow = () => {
    setStopRows((prev) => [...prev, {
      mode: 'existing', stopId: '', stopName: '', address: '', latitude: '', longitude: '', siteName: '', arrivalTime: '',
    }]);
  };

  const buildPayload = (): RouteCreateInput | null => {
    if (!form.routeName || !form.startLocation || !form.endLocation || !form.regionId || !form.durationMinutes || !form.distanceKm) return null;
    const parsedStops = stopRows.map((row, i) => {
      if (!row.arrivalTime) return null;
      if (row.mode === 'existing') {
        if (!row.stopId) return null;
        return { stopId: row.stopId, arrivalTime: row.arrivalTime };
      }
      if (!row.stopName || !row.address || !row.latitude || !row.longitude) return null;
      return {
        stopName: row.stopName,
        address: row.address,
        latitude: Number.parseFloat(row.latitude),
        longitude: Number.parseFloat(row.longitude),
        siteName: row.siteName || null,
        arrivalTime: row.arrivalTime,
      };
    });
    if (parsedStops.some((s) => s === null)) return null;
    return {
      routeName: form.routeName,
      startLocation: form.startLocation,
      endLocation: form.endLocation,
      durationMinutes: Number.parseInt(form.durationMinutes, 10),
      distanceKm: Number.parseInt(form.distanceKm, 10),
      regionId: form.regionId,
      stops: parsedStops as RouteCreateInput['stops'],
    };
  };

  const payload = buildPayload();

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xl font-bold">יצירת מסלול חדש</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <p className="text-center text-slate-500 py-8">טוען...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">שם מסלול</label>
                  <input value={form.routeName} onChange={(e) => setForm({ ...form, routeName: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">תחנת יציאה</label>
                  <input value={form.startLocation} onChange={(e) => setForm({ ...form, startLocation: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">יעד</label>
                  <input value={form.endLocation} onChange={(e) => setForm({ ...form, endLocation: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">אזור (region)</label>
                  <select value={form.regionId} onChange={(e) => setForm({ ...form, regionId: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">בחר אזור...</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>{r.name} ({r.terrainType})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">משך (דקות)</label>
                  <input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">מרחק (ק&quot;מ)</label>
                  <input type="number" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold">תחנות במסלול</h4>
                  <button type="button" onClick={addStopRow} className="text-sm text-indigo-600 font-semibold">+ הוסף תחנה</button>
                </div>
                <div className="space-y-3">
                  {stopRows.map((row, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                      <div className="flex gap-3 items-center">
                        <select
                          value={row.mode}
                          onChange={(e) => {
                            const mode = e.target.value as 'existing' | 'new';
                            setStopRows((prev) => prev.map((r, i) => i === idx ? { ...r, mode } : r));
                          }}
                          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                        >
                          <option value="existing">תחנה קיימת</option>
                          <option value="new">תחנה חדשה</option>
                        </select>
                        <input type="time" value={row.arrivalTime} onChange={(e) => setStopRows((prev) => prev.map((r, i) => i === idx ? { ...r, arrivalTime: e.target.value } : r))} className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                        {stopRows.length > 1 && (
                          <button type="button" onClick={() => setStopRows((prev) => prev.filter((_, i) => i !== idx))} className="text-red-500 text-sm mr-auto">הסר</button>
                        )}
                      </div>
                      {row.mode === 'existing' ? (
                        <select value={row.stopId} onChange={(e) => setStopRows((prev) => prev.map((r, i) => i === idx ? { ...r, stopId: e.target.value } : r))} className="w-full px-4 py-2 rounded-xl border border-slate-200">
                          <option value="">בחר תחנה...</option>
                          {stops.map((s) => (
                            <option key={s.id} value={s.id}>{s.name} — {s.address}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input placeholder="שם תחנה" value={row.stopName} onChange={(e) => setStopRows((prev) => prev.map((r, i) => i === idx ? { ...r, stopName: e.target.value } : r))} className="px-4 py-2 rounded-xl border border-slate-200" />
                          <input placeholder="כתובת" value={row.address} onChange={(e) => setStopRows((prev) => prev.map((r, i) => i === idx ? { ...r, address: e.target.value } : r))} className="px-4 py-2 rounded-xl border border-slate-200" />
                          <input placeholder="Latitude" value={row.latitude} onChange={(e) => setStopRows((prev) => prev.map((r, i) => i === idx ? { ...r, latitude: e.target.value } : r))} className="px-4 py-2 rounded-xl border border-slate-200" />
                          <input placeholder="Longitude" value={row.longitude} onChange={(e) => setStopRows((prev) => prev.map((r, i) => i === idx ? { ...r, longitude: e.target.value } : r))} className="px-4 py-2 rounded-xl border border-slate-200" />
                          <select value={row.siteName} onChange={(e) => setStopRows((prev) => prev.map((r, i) => i === idx ? { ...r, siteName: e.target.value } : r))} className="md:col-span-2 px-4 py-2 rounded-xl border border-slate-200">
                            <option value="">אתר (אופציונלי)</option>
                            {sites.map((s) => (
                              <option key={s.name} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium">ביטול</button>
          <button
            onClick={() => payload && onSave(payload)}
            disabled={!payload || loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-bold"
          >
            שמור מסלול
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AssignmentFormModal({ drivers, onClose, onSave }: { drivers: Driver[], onClose: () => void, onSave: (data: TripAssignment) => void }) {
  const [buses, setBuses] = useState<BusOption[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<TripAssignment>({
    driverId: '',
    busId: '',
    routeId: '',
    date: '',
    time: '',
  });

  useEffect(() => {
    Promise.all([fetchBuses(), fetchRoutes()])
      .then(([busesData, routesData]) => {
        setBuses(busesData);
        setRoutes(routesData);
      })
      .catch(() => alert('שגיאה בטעינת אוטובוסים ומסלולים'))
      .finally(() => setLoading(false));
  }, []);

  const selectedRoute = routes.find((r) => r.id === formData.routeId);

  const canSubmit =
    formData.driverId &&
    formData.busId &&
    formData.routeId &&
    formData.date &&
    formData.time;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xl font-bold">שיבוץ נסיעה חדשה</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <p className="text-center text-slate-500 py-8">טוען נתונים...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">נהג</label>
                  <select 
                    value={formData.driverId}
                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">בחר נהג...</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">אוטובוס</label>
                  <select 
                    value={formData.busId}
                    onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">בחר אוטובוס...</option>
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.manufacturer} {b.model} · {b.licensePlate} ({b.capacity} מקומות)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">מסלול</label>
                  <select 
                    value={formData.routeId}
                    onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">בחר מסלול...</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.startLocation} → {r.endLocation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedRoute && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase">תחנת יציאה</span>
                      <p className="font-medium">{selectedRoute.startLocation}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase">יעד</span>
                      <p className="font-medium">{selectedRoute.endLocation}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase">מרחק</span>
                      <p className="font-medium">{selectedRoute.distanceKm} ק&quot;מ</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase">משך משוער</span>
                      <p className="font-medium">{selectedRoute.durationMinutes} דקות</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">תחנות במסלול</span>
                    <StopsSection stops={selectedRoute.stops} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">תאריך</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">שעה</label>
                  <input 
                    type="time" 
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </>
          )}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium">ביטול</button>
          <button 
            onClick={() => canSubmit && onSave(formData)}
            disabled={!canSubmit || loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100"
          >
            בצע שיבוץ
          </button>
        </div>
      </motion.div>
    </div>
  );
}
