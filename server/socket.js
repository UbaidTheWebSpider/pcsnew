const { Server } = require('socket.io');

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ Socket connected: ${socket.id}`);

        // Join room based on user ID
        socket.on('join:user', (userId) => {
            socket.join(`user:${userId}`);
            console.log(`👤 User ${userId} joined their room`);
        });

        // Join room based on appointment ID
        socket.on('join:appointment', (appointmentId) => {
            socket.join(`appointment:${appointmentId}`);
            console.log(`📅 Joined appointment room: ${appointmentId}`);
        });

        socket.on('disconnect', () => {
            console.log(`❌ Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initializeSocket first.');
    }
    return io;
};

// Emit meeting started event to patient
const emitMeetingStarted = (appointmentId, patientId, appointmentData) => {
    const socketIO = getIO();

    // Emit to patient's personal room
    socketIO.to(`user:${patientId}`).emit('meeting:started', {
        appointmentId,
        appointment: appointmentData,
        message: 'Doctor has started the video consultation'
    });

    // Also emit to appointment room (if anyone is listening)
    socketIO.to(`appointment:${appointmentId}`).emit('meeting:started', {
        appointmentId,
        appointment: appointmentData
    });

    console.log(`🎥 Meeting started event emitted for appointment ${appointmentId}`);
};

// Emit appointment updated event
const emitAppointmentUpdated = (appointmentId, patientId, doctorId, appointmentData) => {
    const socketIO = getIO();

    socketIO.to(`user:${patientId}`).emit('appointment:updated', {
        appointmentId,
        appointment: appointmentData
    });

    socketIO.to(`user:${doctorId}`).emit('appointment:updated', {
        appointmentId,
        appointment: appointmentData
    });

    console.log(`📋 Appointment updated event emitted for ${appointmentId}`);
};

// Emit meeting ended event
const emitMeetingEnded = (appointmentId, patientId, doctorId) => {
    const socketIO = getIO();

    socketIO.to(`user:${patientId}`).emit('meeting:ended', { appointmentId });
    socketIO.to(`user:${doctorId}`).emit('meeting:ended', { appointmentId });

    console.log(`🛑 Meeting ended event emitted for ${appointmentId}`);
};

module.exports = {
    initializeSocket,
    getIO,
    emitMeetingStarted,
    emitAppointmentUpdated,
    emitMeetingEnded
};
