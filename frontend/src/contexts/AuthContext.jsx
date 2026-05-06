import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import wsService from '../services/websocket';

const AuthContext = createContext(null);

function safeParseStoredUser(value) {
  if (!value) return null;
  try { return JSON.parse(value); }
  catch { localStorage.removeItem('user'); return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [enabledModules, setEnabledModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState('disconnected');

  // ── WebSocket connection tracking ─────────────────────────────────────────
  useEffect(() => {
    const unsub = wsService.on('status', ({ status }) => setWsStatus(status));
    return unsub;
  }, []);

  // ── Session restoration ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      const saved = localStorage.getItem('user');
      const savedModules = localStorage.getItem('enabled_modules');
      
      const parsedUser = safeParseStoredUser(saved);
      const parsedModules = savedModules ? JSON.parse(savedModules) : [];

      if (parsedUser && !cancelled) setUser(parsedUser);
      if (parsedModules.length && !cancelled) setEnabledModules(parsedModules);

      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/api/auth/me');
        if (!cancelled) {
          localStorage.setItem('user', JSON.stringify(data));
          setUser(data);
          // Connect WebSocket with fresh token
          wsService.connect(token);
        }
      } catch (err) {
        console.error('Session restoration failed:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('enabled_modules');
        if (!cancelled) {
          setUser(null);
          setEnabledModules([]);
        }
        wsService.disconnect();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/api/auth/login', { username, password });
    localStorage.setItem('token', data.access_token);
    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('enabled_modules', JSON.stringify(data.enabled_modules));
    
    setUser(data.user);
    setEnabledModules(data.enabled_modules);
    
    // Connect real-time notifications
    wsService.connect(data.access_token);
    return { user: data.user, modules: data.enabled_modules };
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('enabled_modules');
    setUser(null);
    setEnabledModules([]);
    wsService.disconnect();
  }, []);

  // ── Permission & Module Helpers ───────────────────────────────────────────
  const hasPermission = useCallback((permission) => {
    if (!permission) return true;
    return user?.permissions?.includes(permission) || false;
  }, [user]);

  const isModuleEnabled = useCallback((moduleName) => {
    if (!moduleName || moduleName.toLowerCase() === 'core') return true;
    if (enabledModules.length === 0) return true; // Fallback for first-time login after update
    return enabledModules.includes(moduleName.toLowerCase());
  }, [enabledModules]);

  const hasAnyPermission = useCallback((permissions = []) => {
    if (!permissions.length) return true;
    return permissions.some((p) => hasPermission(p));
  }, [hasPermission]);

  const hasRole = useCallback((role) => {
    if (!role) return true;
    return user?.role === role;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, enabledModules, isModuleEnabled,
      login, logout, loading,
      hasPermission, hasAnyPermission, hasRole,
      wsStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
