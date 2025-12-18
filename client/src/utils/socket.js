import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect(userId) {
        if (this.socket?.connected) {
            console.log('Socket already connected');
            return;
        }

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket connected:', this.socket.id);
            if (userId) {
                this.socket.emit('join:user', userId);
            }
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.listeners.clear();
        }
    }

    // Join user-specific room
    joinUserRoom(userId) {
        if (this.socket?.connected) {
            this.socket.emit('join:user', userId);
        }
    }

    // Join appointment-specific room
    joinAppointmentRoom(appointmentId) {
        if (this.socket?.connected) {
            this.socket.emit('join:appointment', appointmentId);
        }
    }

    // Listen for meeting started event
    onMeetingStarted(callback) {
        if (this.socket) {
            this.socket.on('meeting:started', callback);
            this.listeners.set('meeting:started', callback);
        }
    }

    // Listen for appointment updated event
    onAppointmentUpdated(callback) {
        if (this.socket) {
            this.socket.on('appointment:updated', callback);
            this.listeners.set('appointment:updated', callback);
        }
    }

    // Listen for meeting ended event
    onMeetingEnded(callback) {
        if (this.socket) {
            this.socket.on('meeting:ended', callback);
            this.listeners.set('meeting:ended', callback);
        }
    }

    // Remove specific listener
    off(eventName) {
        if (this.socket && this.listeners.has(eventName)) {
            this.socket.off(eventName, this.listeners.get(eventName));
            this.listeners.delete(eventName);
        }
    }

    // Remove all listeners
    removeAllListeners() {
        if (this.socket) {
            this.listeners.forEach((callback, eventName) => {
                this.socket.off(eventName, callback);
            });
            this.listeners.clear();
        }
    }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
