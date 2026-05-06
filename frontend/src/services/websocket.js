/**
 * WebSocket client service for HIAOS real-time notifications.
 * Auto-reconnects on disconnect with exponential backoff.
 */

const WS_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
  .replace('https://', 'wss://')
  .replace('http://', 'ws://');

class HiaosWebSocket {
  constructor() {
    this.socket = null;
    this.listeners = {};        // event -> [callbacks]
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // ms, doubles each attempt
    this.pingInterval = null;
    this.isIntentionallyClosed = false;
    this.connectionStatus = 'disconnected'; // disconnected | connecting | connected
  }

  connect(token) {
    if (!token) return;
    if (this.connectionStatus === 'connected' || this.connectionStatus === 'connecting') return;

    this.isIntentionallyClosed = false;
    this.connectionStatus = 'connecting';
    this._emit('status', { status: 'connecting' });

    try {
      this.socket = new WebSocket(`${WS_BASE}/ws/notifications?token=${encodeURIComponent(token)}`);

      this.socket.onopen = () => {
        this.connectionStatus = 'connected';
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this._emit('status', { status: 'connected' });
        this._startPing();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._emit('message', data);
          if (data.type) this._emit(data.type, data);
        } catch {
          // ignore parse errors
        }
      };

      this.socket.onclose = (event) => {
        this.connectionStatus = 'disconnected';
        this._stopPing();
        this._emit('status', { status: 'disconnected', code: event.code });

        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000);
          setTimeout(() => this.connect(token), delay);
        }
      };

      this.socket.onerror = () => {
        this.connectionStatus = 'disconnected';
        this._emit('status', { status: 'error' });
      };
    } catch (err) {
      this.connectionStatus = 'disconnected';
    }
  }

  disconnect() {
    this.isIntentionallyClosed = true;
    this._stopPing();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connectionStatus = 'disconnected';
    this._emit('status', { status: 'disconnected' });
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => this.off(event, callback); // returns unsubscribe fn
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  getStatus() {
    return this.connectionStatus;
  }

  _emit(event, data) {
    (this.listeners[event] || []).forEach((cb) => {
      try { cb(data); } catch { /* ignore */ }
    });
  }

  _startPing() {
    this._stopPing();
    this.pingInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send('ping');
      }
    }, 30000); // ping every 30 seconds
  }

  _stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

// Singleton
const wsService = new HiaosWebSocket();
export default wsService;
