const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');

// @desc    Get all patients assigned to doctor
// @route   GET /api/doctor/patients
// @access  Private/Doctor
const getPatients = async (req, res) => {
    try {
        const { search, page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = req.query;

        const query = { assignedDoctorId: req.user._id };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { patientId: { $regex: search, $options: 'i' } },
                { cnic: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Patient.countDocuments(query);
        const patients = await Patient.find(query)
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        res.json({
            success: true,
            data: {
                patients,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
            // Simple conflict check - can be enhanced with time overlap logic
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
