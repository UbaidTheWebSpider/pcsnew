const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');

// @desc    Get patient profile
// @route   GET /api/patient/profile
// @access  Private/Patient
const getProfile = async (req, res) => {
    try {
        const patient = await User.findById(req.user._id).select('-password');

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        res.json({
            success: true,
            data: patient,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update patient profile
// @route   PUT /api/patient/profile
// @access  Private/Patient
const updateProfile = async (req, res) => {
    try {
        const { name, contact, medicalInfo } = req.body;

        const patient = await User.findById(req.user._id);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        if (name) patient.name = name;
        if (contact) patient.contact = { ...patient.contact, ...contact };
        if (medicalInfo) patient.medicalInfo = { ...patient.medicalInfo, ...medicalInfo };

        await patient.save();

        const updated = await User.findById(req.user._id).select('-password');

        res.json({
            success: true,
            data: updated,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get patient dashboard stats
// @route   GET /api/patient/dashboard
// @access  Private/Patient
const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingAppointments = await Appointment.find({
            patientId: req.user._id,
            scheduledDate: { $gte: today },
            status: { $in: ['pending', 'confirmed'] },
        })
            .populate('doctorId', 'name specialization')
            .sort({ scheduledDate: 1 })
            .limit(5);

        const recentPrescriptions = await Prescription.find({
            patientId: req.user._id,
        })
            .populate('doctorId', 'name specialization')
            .sort({ createdAt: -1 })
            .limit(5);

        const totalAppointments = await Appointment.countDocuments({
            patientId: req.user._id,
        });

        const completedAppointments = await Appointment.countDocuments({
            patientId: req.user._id,
            status: 'completed',
        });

        res.json({
            success: true,
            data: {
                upcomingAppointments,
                recentPrescriptions,
                stats: {
                    totalAppointments,
                    completedAppointments,
                    upcomingCount: upcomingAppointments.length,
                    prescriptionsCount: recentPrescriptions.length,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get patient appointments
// @route   GET /api/patient/appointments
// @access  Private/Patient
const getAppointments = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;

        const query = { patientId: req.user._id };

        if (status) query.status = status;
        if (startDate && endDate) {
            query.scheduledDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const appointments = await Appointment.find(query)
            .populate('doctorId', 'name specialization contact')
            .sort({ scheduledDate: -1 });

        res.json({
            success: true,
            data: {
                appointments,
                total: appointments.length,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Book appointment
// @route   POST /api/patient/appointments
// @access  Private/Patient
const bookAppointment = async (req, res) => {
    try {
        const { doctorId, scheduledDate, scheduledTime, type, reason, isTelemedicine } = req.body;

        const existingAppointment = await Appointment.findOne({
            patientId: req.user._id,
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            status: { $nin: ['cancelled', 'completed'] },
        });

        if (existingAppointment) {
            return res.status(400).json({ message: 'You already have an appointment at this time' });
        }

        const appointment = await Appointment.create({
            patientId: req.user._id,
            doctorId,
            scheduledDate,
            scheduledTime,
            type,
            reason,
            isTelemedicine,
            status: 'pending',
        });

        const populated = await Appointment.findById(appointment._id)
            .populate('doctorId', 'name specialization contact');

        res.status(201).json({
            success: true,
            data: populated,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel appointment
// @route   PUT /api/patient/appointments/:id/cancel
// @access  Private/Patient
const cancelAppointment = async (req, res) => {
    try {
        const { reason } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (appointment.patientId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        appointment.status = 'cancelled';
        appointment.cancelReason = reason;

        await appointment.save();

        res.json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get patient prescriptions
// @route   GET /api/patient/prescriptions
// @access  Private/Patient
const getPrescriptions = async (req, res) => {
    try {
        const prescriptions = await Prescription.find({
            patientId: req.user._id,
        })
            .populate('doctorId', 'name specialization')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                prescriptions,
                total: prescriptions.length,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get prescription by ID
// @route   GET /api/patient/prescriptions/:id
// @access  Private/Patient
const getPrescriptionById = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate('doctorId', 'name specialization contact')
            .populate('patientId', 'name contact');

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        if (prescription.patientId._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json({
            success: true,
            data: prescription,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all doctors for patient
// @route   GET /api/patient/doctors
// @access  Private/Patient
const getDoctors = async (req, res) => {
    try {
        const { search, specialization } = req.query;

        const query = { role: 'doctor' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { specialization: { $regex: search, $options: 'i' } },
            ];
        }

        if (specialization && specialization !== 'All Specializations') {
            query.specialization = specialization;
        }

        const doctors = await User.find(query).select('-password');

        res.json({
            success: true,
            data: {
                doctors,
                total: doctors.length,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get doctor by ID
// @route   GET /api/patient/doctors/:id
// @access  Private/Patient
const getDoctorById = async (req, res) => {
    try {
        const doctor = await User.findById(req.params.id).select('-password');

        if (!doctor || doctor.role !== 'doctor') {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.json({
            success: true,
            data: doctor,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Join consultation video call
// @route   POST /api/patient/appointments/join-consultation
// @access  Private/Patient
const joinConsultation = async (req, res) => {
    const { appointmentId } = req.body;

    try {
        const appointment = await Appointment.findById(appointmentId)
            .populate('patientId', 'name')
            .populate('doctorId', 'name');

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Verify user is the patient for this appointment
        if (appointment.patientId._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to join this meeting' });
        }

        // Check if meeting details exist
        console.log('DEBUG - Appointment data:', {
            _id: appointment._id,
            videoRoomId: appointment.videoRoomId,
            telemedicineRoomId: appointment.telemedicineRoomId,
            status: appointment.status
        });

        if (!appointment.videoRoomId || !appointment.telemedicineRoomId) {
            return res.status(400).json({ message: 'Meeting has not been started by the doctor yet.' });
        }

        const BBBService = require('../services/BBBService');

        // Extract passwords from stored field
        // Format: "attendeePW:moderatorPW"
        const [attendeePW] = appointment.telemedicineRoomId.split(':');

        if (!attendeePW) {
            return res.status(500).json({ message: 'Meeting configuration error.' });
        }

        // Generate Join URL for Patient (Attendee)
        const joinUrl = BBBService.getJoinUrl(
            appointment.videoRoomId,
            appointment.patientId.name,
            attendeePW
        );

        res.json({
            success: true,
            message: 'Joining video consultation...',
            videoCallUrl: joinUrl,
            roomId: appointment.videoRoomId
        });

    } catch (error) {
        console.error('Join Consultation Error:', error);
        res.status(500).json({
            message: error.message || 'Failed to join video call'
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getDashboardStats,
    getAppointments,
    bookAppointment,
    cancelAppointment,
    getPrescriptions,
    getPrescriptionById,
    getDoctors,
    getDoctorById,
    joinConsultation,
};
