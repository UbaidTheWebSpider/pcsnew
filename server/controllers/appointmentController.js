const Appointment = require('../models/Appointment');

// @desc    Get all appointments for a doctor
// @route   GET /api/appointments/doctor
// @access  Private/Doctor
const getDoctorAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ doctorId: req.user._id })
            .populate('patientId', 'name email contact')
            .sort({ date: 1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private/Doctor
const updateAppointmentStatus = async (req, res) => {
    const { status } = req.body;
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (appointment.doctorId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        appointment.status = status;
        await appointment.save();
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add consultation notes
// @route   PUT /api/appointments/:id/notes
// @access  Private/Doctor
const addConsultationNotes = async (req, res) => {
    const { notes } = req.body;
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (appointment.doctorId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        appointment.notes = notes;
        await appointment.save();
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Book an appointment
// @route   POST /api/appointments
// @access  Private/Patient
const bookAppointment = async (req, res) => {
    const { doctorId, hospitalId, date } = req.body;
    try {
        const appointment = await Appointment.create({
            patientId: req.user._id,
            doctorId,
            hospitalId,
            date,
        });
        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Start consultation with video call (BigBlueButton)
// @route   POST /api/appointments/start-consultation
// @access  Private/Doctor
const startConsultation = async (req, res) => {
    const { appointmentId } = req.body;

    try {
        const appointment = await Appointment.findById(appointmentId)
            .populate('patientId', 'name')
            .populate('doctorId', 'name');

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Verify user is the doctor for this appointment
        if (appointment.doctorId._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to start this meeting' });
        }

        const BBBService = require('../services/BBBService');
        const crypto = require('crypto');
        const { emitMeetingStarted } = require('../socket');

        // Check if meeting is already running
        if (appointment.bbbMeetingId && appointment.meetingStatus === 'in_progress') {
            const isRunning = await BBBService.isMeetingRunning(appointment.bbbMeetingId);

            if (isRunning) {
                // Return existing join URL for moderator
                const joinUrl = BBBService.getJoinUrl(
                    appointment.bbbMeetingId,
                    `Dr. ${appointment.doctorId.name}`,
                    appointment.bbbModeratorPassword
                );

                return res.json({
                    success: true,
                    message: 'Video call already running',
                    videoCallUrl: joinUrl,
                    roomId: appointment.bbbMeetingId,
                    appointment
                });
            }
        }

        // Generate Meeting Details
        const meetingID = `mtg-${appointment._id}`;
        const attendeePW = crypto.randomBytes(6).toString('hex'); // 12 char password
        const moderatorPW = crypto.randomBytes(6).toString('hex'); // 12 char password
        const meetingName = `Consultation: ${appointment.patientId.name}`;

        // Create BBB Meeting
        await BBBService.createMeeting(meetingID, meetingName, attendeePW, moderatorPW);

        // Generate Join URL for Doctor (Moderator)
        const joinUrl = BBBService.getJoinUrl(
            meetingID,
            `Dr. ${appointment.doctorId.name}`,
            moderatorPW
        );

        // Update Appointment with BBB Details using new schema fields
        appointment.bbbMeetingId = meetingID;
        appointment.bbbAttendeePassword = attendeePW;
        appointment.bbbModeratorPassword = moderatorPW;
        appointment.meetingStatus = 'in_progress';
        appointment.meetingStartedAt = new Date();
        appointment.status = 'in-progress';

        // Keep legacy fields for backward compatibility
        appointment.videoRoomId = meetingID;
        appointment.telemedicineRoomId = `${attendeePW}:${moderatorPW}`;

        await appointment.save();

        console.log('✅ Meeting started:', {
            appointmentId: appointment._id,
            bbbMeetingId: appointment.bbbMeetingId,
            meetingStatus: appointment.meetingStatus,
            status: appointment.status
        });

        // Emit real-time event to patient
        try {
            emitMeetingStarted(
                appointment._id.toString(),
                appointment.patientId._id.toString(),
                {
                    _id: appointment._id,
                    bbbMeetingId: appointment.bbbMeetingId,
                    meetingStatus: appointment.meetingStatus,
                    status: appointment.status,
                    doctorId: appointment.doctorId,
                    scheduledDate: appointment.scheduledDate,
                    scheduledTime: appointment.scheduledTime
                }
            );
        } catch (socketError) {
            console.error('⚠️ Socket emit failed (non-critical):', socketError.message);
        }

        res.json({
            success: true,
            message: 'Video call room created successfully',
            videoCallUrl: joinUrl,
            roomId: meetingID,
            appointment
        });

    } catch (error) {
        console.error('❌ Start Consultation Error:', error);
        res.status(500).json({
            message: error.message || 'Failed to create video call room'
        });
    }
};

module.exports = {
    getDoctorAppointments,
    updateAppointmentStatus,
    addConsultationNotes,
    bookAppointment,
    startConsultation,
};
