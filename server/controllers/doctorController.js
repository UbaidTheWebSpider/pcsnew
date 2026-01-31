const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const StaffPatient = require('../models/StaffPatient');
const bbbService = require('../utils/bbbService');

// @desc    Get doctor profile
// @route   GET /api/doctor/profile
// @access  Private/Doctor
const getProfile = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id }).populate('userId', 'name email contact');
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }
        res.json({ success: true, data: doctor });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update doctor profile
// @route   PUT /api/doctor/profile
// @access  Private/Doctor
const updateProfile = async (req, res) => {
    try {
        const { personalDetails, professionalDetails, scheduleSettings, consultationFees, telemedicine } = req.body;

        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        if (personalDetails) doctor.personalDetails = { ...doctor.personalDetails, ...personalDetails };
        if (professionalDetails) doctor.professionalDetails = { ...doctor.professionalDetails, ...professionalDetails };
        if (scheduleSettings) doctor.scheduleSettings = scheduleSettings;
        if (consultationFees) doctor.consultationFees = consultationFees;
        if (telemedicine) doctor.telemedicine = telemedicine;

        await doctor.save();
        res.json({ success: true, data: doctor });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate appointment slots
// @route   POST /api/doctor/schedule/generate
// @access  Private/Doctor
const generateSchedule = async (req, res) => {
    try {
        const { startDate, endDate } = req.body; // YYYY-MM-DD
        const doctor = await Doctor.findOne({ userId: req.user._id });

        if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

        const start = new Date(startDate);
        const end = new Date(endDate);
        const slots = [];

        // Loop through each day
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
            const daySchedule = doctor.scheduleSettings.weeklyAvailability.find(s => s.day === dayName && s.isAvailable);

            if (daySchedule) {
                let currentTime = new Date(`${d.toISOString().split('T')[0]}T${daySchedule.startTime}`);
                const endTime = new Date(`${d.toISOString().split('T')[0]}T${daySchedule.endTime}`);

                while (currentTime < endTime) {
                    const timeString = currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

                    // Check if slot already exists to avoid duplicates
                    const exists = await Appointment.findOne({
                        doctorId: req.user._id,
                        scheduledDate: d,
                        scheduledTime: timeString
                    });

                    if (!exists) {
                        slots.push({
                            date: d.toISOString().split('T')[0],
                            time: timeString,
                            available: true
                        });
                    }

                    currentTime.setMinutes(currentTime.getMinutes() + doctor.scheduleSettings.slotDuration);
                }
            }
        }

        res.json({ success: true, data: slots });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Start Telemedicine Session (BBB)
// @route   POST /api/doctor/appointments/:id/start-video
// @access  Private/Doctor
const startTelemedicineSession = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id).populate('patientId');
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        if (appointment.doctorId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const meetingID = `appt-${appointment._id}`;
        const meetingName = `Consultation with ${appointment.patientId.name}`;

        // Create meeting on BBB
        await bbbService.createMeeting(meetingID, meetingName);

        // Generate Join URLs
        const moderatorUrl = bbbService.getJoinUrl(meetingID, req.user.name, 'mp'); // Doctor is moderator
        const attendeeUrl = bbbService.getJoinUrl(meetingID, appointment.patientId.name, 'ap'); // Patient is attendee

        // Save meeting details to appointment
        appointment.meetingId = meetingID;
        appointment.meetingUrl = attendeeUrl; // Save patient's join URL
        appointment.status = 'in-progress';
        await appointment.save();

        res.json({
            success: true,
            data: {
                joinUrl: moderatorUrl,
                patientJoinUrl: attendeeUrl
            }
        });
    } catch (error) {
        console.error('Telemedicine Error:', error);
        res.status(500).json({ message: 'Failed to start video session' });
    }
};

// @desc    Get all patients assigned to doctor
// @route   GET /api/doctor/patients
// @access  Private/Doctor
const getPatients = async (req, res) => {
    try {
        const { search } = req.query;
        const doctorId = req.user._id;

        // 1. Get manually assigned patients from Patient collection
        const assignedPatients = await Patient.find({ assignedDoctorId: doctorId, isDeleted: false });

        // 2. Get assigned patients from StaffPatient collection
        const assignedStaffPatients = await StaffPatient.find({
            'admissionDetails.assignedDoctorId': doctorId,
            isActive: true
        });

        // 3. Get userIds from appointments and prescriptions (consulted users)
        const [appointmentUsers, prescriptionUsers] = await Promise.all([
            Appointment.find({ doctorId: doctorId }).distinct('patientId'),
            Prescription.find({ doctorId: doctorId }).distinct('patientId')
        ]);

        const extraUserIds = [...new Set([...appointmentUsers, ...prescriptionUsers])].filter(id => id);

        // 4. Find Patients linked to these userIds
        const linkedPatients = await Patient.find({
            userId: { $in: extraUserIds },
            isDeleted: false
        });

        // 5. Identify User IDs that don't have a Patient record yet
        const patientUserIds = new Set(linkedPatients.map(p => p.userId?.toString()));
        const userIdsWithoutPatientRecord = extraUserIds.filter(id => !patientUserIds.has(id.toString()));

        // 6. Fetch User records for those without Patient profiles
        const ghostUsers = await User.find({
            _id: { $in: userIdsWithoutPatientRecord },
            role: 'patient'
        });

        // 7. Normalize and Merge
        const combinedMap = new Map();

        // Helper to normalize Patient
        const normPatient = (p) => ({
            _id: p._id,
            name: p.name,
            patientId: p.patientId || p.healthId || 'REG-PT',
            contact: p.contact?.phone || 'N/A',
            age: p.age || (p.dateOfBirth ? Math.floor((new Date() - new Date(p.dateOfBirth)) / 31557600000) : 'N/A'),
            gender: p.gender || 'N/A',
            cnic: p.cnic || 'N/A',
            updatedAt: p.updatedAt,
            source: 'clinical'
        });

        // Helper to normalize StaffPatient
        const normStaff = (p) => ({
            _id: p._id,
            name: p.personalInfo?.fullName || 'Unknown Staff Patient',
            patientId: p.patientId || p.healthId || 'STAFF-PT',
            contact: p.contactInfo?.mobileNumber || 'N/A',
            age: p.personalInfo?.dateOfBirth ? Math.floor((new Date() - new Date(p.personalInfo.dateOfBirth)) / 31557600000) : 'N/A',
            gender: p.personalInfo?.gender || 'N/A',
            cnic: p.personalInfo?.cnic || 'N/A',
            updatedAt: p.updatedAt,
            source: 'staff'
        });

        // Helper to normalize User (Ghost Patient)
        const normUser = (u) => ({
            _id: u._id,
            name: u.name,
            patientId: u.healthId || 'USER-PT',
            contact: u.contact?.phone || 'N/A',
            age: u.dateOfBirth ? Math.floor((new Date() - new Date(u.dateOfBirth)) / 31557600000) : 'N/A',
            gender: u.gender || 'N/A',
            cnic: 'N/A',
            updatedAt: u.createdAt,
            source: 'user'
        });

        assignedPatients.forEach(p => combinedMap.set(p._id.toString(), normPatient(p)));
        linkedPatients.forEach(p => combinedMap.set(p._id.toString(), normPatient(p)));
        assignedStaffPatients.forEach(p => combinedMap.set(p._id.toString(), normStaff(p)));
        ghostUsers.forEach(u => combinedMap.set(u._id.toString(), normUser(u)));

        let finalPatients = Array.from(combinedMap.values());

        // 8. Filter by Search
        if (search) {
            const lowSearch = search.toLowerCase();
            finalPatients = finalPatients.filter(p =>
                p.name?.toLowerCase().includes(lowSearch) ||
                p.patientId?.toLowerCase().includes(lowSearch) ||
                p.cnic?.includes(search)
            );
        }

        res.status(200).json({
            success: true,
            data: {
                total: finalPatients.length,
                patients: finalPatients
            }
        });
    } catch (error) {
        console.error('Error in getPatients:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get patient details with full medical history
// @route   GET /api/doctor/patients/:id
// @access  Private/Doctor
const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        if (patient.assignedDoctorId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to view this patient' });
        }

        const prescriptions = await Prescription.find({ patientId: patient._id })
            .sort({ createdAt: -1 })
            .limit(10);

        const upcomingAppointments = await Appointment.find({
            patientId: patient._id,
            doctorId: req.user._id,
            scheduledDate: { $gte: new Date() },
            status: { $in: ['pending', 'confirmed'] },
        }).sort({ scheduledDate: 1 });

        res.json({
            success: true,
            data: {
                patient,
                prescriptions,
                upcomingAppointments,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add note to patient record
// @route   POST /api/doctor/patients/:id/notes
// @access  Private/Doctor
const addPatientNote = async (req, res) => {
    try {
        const { note } = req.body;
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        patient.notes.push({
            doctorId: req.user._id,
            note,
            createdAt: new Date(),
        });

        await patient.save();

        res.json({
            success: true,
            data: patient,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update patient note
// @route   PUT /api/doctor/patients/:id/notes/:noteId
// @access  Private/Doctor
const updatePatientNote = async (req, res) => {
    try {
        const { note } = req.body;
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const noteToUpdate = patient.notes.id(req.params.noteId);
        if (!noteToUpdate) {
            return res.status(404).json({ message: 'Note not found' });
        }

        if (noteToUpdate.doctorId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to update this note' });
        }

        noteToUpdate.note = note;
        await patient.save();

        res.json({
            success: true,
            data: patient,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete patient note
// @route   DELETE /api/doctor/patients/:id/notes/:noteId
// @access  Private/Doctor
const deletePatientNote = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const noteToDelete = patient.notes.id(req.params.noteId);
        if (!noteToDelete) {
            return res.status(404).json({ message: 'Note not found' });
        }

        if (noteToDelete.doctorId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this note' });
        }

        noteToDelete.remove();
        await patient.save();

        res.json({
            success: true,
            message: 'Note deleted',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get doctor's appointments
// @route   GET /api/doctor/appointments
// @access  Private/Doctor
const getAppointments = async (req, res) => {
    try {
        const { date, startDate, endDate, type, status } = req.query;

        const query = { doctorId: req.user._id };

        if (date) {
            const targetDate = new Date(date);
            query.scheduledDate = {
                $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                $lt: new Date(targetDate.setHours(23, 59, 59, 999)),
            };
        } else if (startDate && endDate) {
            query.scheduledDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        if (type) query.type = type;
        if (status) query.status = status;

        const appointments = await Appointment.find(query)
            .populate('patientId', 'name email contact')
            .sort({ scheduledDate: 1, scheduledTime: 1 });

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

// @desc    Create new appointment
// @route   POST /api/doctor/appointments
// @access  Private/Doctor
const createAppointment = async (req, res) => {
    try {
        const { patientId, type, scheduledDate, scheduledTime, duration, reason, isTelemedicine } = req.body;

        // Check for conflicts
        const conflict = await Appointment.findOne({
            doctorId: req.user._id,
            scheduledDate: new Date(scheduledDate),
            status: { $nin: ['cancelled', 'completed'] },
        });

        if (conflict) {
            return res.status(400).json({ message: 'Time slot may be occupied' });
        }

        const appointment = await Appointment.create({
            patientId,
            doctorId: req.user._id,
            hospitalId: req.user.hospitalId,
            type,
            scheduledDate,
            scheduledTime,
            duration,
            reason,
            isTelemedicine,
            status: 'confirmed',
        });

        const populated = await Appointment.findById(appointment._id)
            .populate('patientId', 'name email contact');

        res.status(201).json({
            success: true,
            data: populated,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reschedule appointment
// @route   PUT /api/doctor/appointments/:id/reschedule
// @access  Private/Doctor
const rescheduleAppointment = async (req, res) => {
    try {
        const { newDate, newTime, reason } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (appointment.doctorId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        appointment.rescheduledFrom = appointment._id;
        appointment.scheduledDate = newDate;
        appointment.scheduledTime = newTime;
        appointment.notes = `Rescheduled: ${reason}`;

        await appointment.save();

        res.json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel appointment
// @route   PUT /api/doctor/appointments/:id/cancel
// @access  Private/Doctor
const cancelAppointment = async (req, res) => {
    try {
        const { reason } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (appointment.doctorId.toString() !== req.user._id.toString()) {
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

// @desc    Complete appointment
// @route   PUT /api/doctor/appointments/:id/complete
// @access  Private/Doctor
const completeAppointment = async (req, res) => {
    try {
        const { consultationNotes, prescriptionId } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (appointment.doctorId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        appointment.status = 'completed';
        appointment.consultationNotes = consultationNotes;
        if (prescriptionId) appointment.prescriptionId = prescriptionId;

        await appointment.save();

        res.json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    generateSchedule,
    startTelemedicineSession,
    getPatients,
    getPatientById,
    addPatientNote,
    updatePatientNote,
    deletePatientNote,
    getAppointments,
    createAppointment,
    rescheduleAppointment,
    cancelAppointment,
    completeAppointment,
};
