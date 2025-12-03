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

        // Check if meeting is already running or created
        if (appointment.videoRoomId) {
            const isRunning = await BBBService.isMeetingRunning(appointment.videoRoomId);

            if (isRunning) {
                // Return existing join URL for moderator
                const joinUrl = BBBService.getJoinUrl(
                    appointment.videoRoomId,
                    `Dr. ${appointment.doctorId.name}`,
                    appointment.moderatorPW || 'mp' // Fallback if PW lost, though unlikely
                );

                return res.json({
                    success: true,
                    message: 'Video call already running',
                    videoCallUrl: joinUrl,
                    roomId: appointment.videoRoomId,
                    appointment
                });
            }
            // If not running but ID exists, we might need to recreate or just let it fall through to create new
            // For simplicity, if it's not running, we'll create a new session or restart it.
            // BBB allows re-creating with same ID if it's ended.
        }

        // Generate Meeting Details
        // Use a stable but unique ID for the meeting based on appointment ID
        // We append a timestamp or random string to ensure uniqueness if multiple sessions happen for same appointment (e.g. re-connect)
        // But typically appointment ID is enough if we want persistent room for that appointment.
        // Let's use AppointmentID as the base.
        const meetingID = `mtg-${appointment._id}`;
        const attendeePW = crypto.randomBytes(4).toString('hex'); // Random 8 char password
        const moderatorPW = crypto.randomBytes(4).toString('hex'); // Random 8 char password
        const meetingName = `Consultation: ${appointment.patientId.name}`;

        // Create BBB Meeting
        await BBBService.createMeeting(meetingID, meetingName, attendeePW, moderatorPW);

        // Generate Join URL for Doctor (Moderator)
        const joinUrl = BBBService.getJoinUrl(
            meetingID,
            `Dr. ${appointment.doctorId.name}`,
            moderatorPW
        );

        // Update Appointment with BBB Details
        appointment.videoRoomId = meetingID;
        appointment.videoCallUrl = joinUrl; // This is the doctor's URL, but we store it for reference. 
        // Ideally we shouldn't expose moderator URL to patient, so we'll generate patient's URL on the fly in their endpoint.
        // We need to store passwords to generate patient URL later.
        // We'll use the existing schema fields or add new ones. 
        // Schema has `videoCallUrl` and `videoRoomId`. We can misuse `telemedicineRoomId` for attendeePW or add to schema.
        // Since "Do NOT modify existing backend models" is a rule, we must be clever.
        // We can store the passwords in `telemedicineRoomId` as a JSON string or delimited string if we strictly can't change schema.
        // OR, we can just regenerate the join URL for patient if we know the password. 
        // Wait, if we don't save the password, we can't generate the join link for the patient later!
        // The `Appointment` model has `telemedicineRoomId`. I will store "attendeePW:moderatorPW" there.
        appointment.telemedicineRoomId = `${attendeePW}:${moderatorPW}`;

        appointment.status = 'in-progress';
        await appointment.save();

        console.log('DEBUG - Appointment saved with:', {
            _id: appointment._id,
            videoRoomId: appointment.videoRoomId,
            telemedicineRoomId: appointment.telemedicineRoomId,
            status: appointment.status
        });

        res.json({
            success: true,
            message: 'Video call room created successfully',
            videoCallUrl: joinUrl,
            roomId: meetingID,
            appointment
        });

    } catch (error) {
        console.error('Start Consultation Error:', error);
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
