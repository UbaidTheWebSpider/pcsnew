const CheckIn = require('../models/CheckIn');
const DepartmentQueue = require('../models/DepartmentQueue');
const ERTriage = require('../models/ERTriage');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Bed = require('../models/Bed');
const { createMeeting } = require('../utils/bbbService');

// Helper: Get or create today's queue for department
const getTodayQueue = async (department, doctorId = null, hospitalId) => {
    const today = new Date().setHours(0, 0, 0, 0);

    let queue = await DepartmentQueue.findOne({
        department,
        date: today,
        ...(doctorId && { doctorId }),
        hospitalId
    });

    if (!queue) {
        queue = await DepartmentQueue.create({
            department,
            date: today,
            ...(doctorId && { doctorId }),
            hospitalId,
            queueItems: [],
            stats: { total: 0, waiting: 0, inProgress: 0, completed: 0 }
        });
    }

    return queue;
};

// Helper: Generate token number
const generateToken = async (department) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const count = await CheckIn.countDocuments({
        department,
        createdAt: { $gte: today }
    });
    return `${department.substring(0, 3)}${String(count + 1).padStart(4, '0')}`;
};

// @desc    Check in a patient
// @route   POST /api/checkin
// @access  Private/Staff
const checkInPatient = async (req, res) => {
    try {
        const {
            patientId, cnic, department, appointmentId, doctorId,
            checkInReason, priorityLevel, triageData, wardPreference,
            testOrders, previousVisitId
        } = req.body;

        // Find patient
        let patient;
        if (patientId) {
            patient = await Patient.findById(patientId);
        } else if (cnic) {
            patient = await Patient.findOne({ cnic });
        }

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Department-specific validation
        if (department === 'OPD' && !doctorId) {
            return res.status(400).json({ message: 'Doctor is required for OPD check-in' });
        }

        // Create check-in record
        const checkInData = {
            patientId: patient._id,
            department,
            checkInReason,
            priorityLevel: priorityLevel || 'Normal',
            createdBy: req.user._id,
            hospitalId: req.user.hospitalId || req.user._id,
        };

        if (appointmentId) checkInData.appointmentId = appointmentId;
        if (doctorId) checkInData.doctorId = doctorId;

        // Department-specific logic
        switch (department) {
            case 'OPD':
                // Verify appointment if provided
                if (appointmentId) {
                    const appointment = await Appointment.findById(appointmentId);
                    if (!appointment) {
                        return res.status(404).json({ message: 'Appointment not found' });
                    }
                    if (appointment.status === 'completed') {
                        return res.status(400).json({ message: 'Appointment already completed' });
                    }
                }
                break;

            case 'ER':
                // ER doesn't require appointment
                checkInData.priorityLevel = priorityLevel || 'Urgent';
                if (triageData) {
                    checkInData.triageLevel = triageData.triageLevel || 'YELLOW';
                }
                break;

            case 'IPD':
                // Assign bed
                let bed = await Bed.findOne({
                    ward: wardPreference || 'General Ward',
                    isOccupied: false
                });

                if (!bed) {
                    return res.status(400).json({ message: 'No available beds in requested ward' });
                }

                checkInData.wardBed = bed.bedNumber;
                bed.isOccupied = true;
                bed.currentPatientId = patient._id;
                await bed.save();
                break;

            case 'LAB':
            case 'RADIOLOGY':
                // Generate token number
                checkInData.tokenNumber = await generateToken(department);
                if (testOrders && testOrders.length > 0) {
                    checkInData.testOrders = testOrders;
                }
                break;

            case 'TELEMEDICINE':
                // Generate meeting link
                if (appointmentId) {
                    const appointment = await Appointment.findById(appointmentId);
                    if (appointment && appointment.meetingLink) {
                        checkInData.meetingLink = appointment.meetingLink;
                        checkInData.meetingId = appointment.meetingId;
                    } else {
                        // Create new meeting
                        const meetingName = `Telemedicine - ${patient.name}`;
                        const meeting = await createMeeting(meetingName, appointmentId);
                        checkInData.meetingLink = meeting.joinUrl;
                        checkInData.meetingId = meeting.meetingId;
                    }
                }
                break;

            case 'FOLLOWUP':
                if (previousVisitId) {
                    checkInData.previousVisitId = previousVisitId;
                }
                break;
        }

        // Create check-in
        const checkIn = await CheckIn.create(checkInData);

        // Add to department queue
        const queue = await getTodayQueue(
            department,
            doctorId,
            req.user.hospitalId || req.user._id
        );

        const queueNumber = queue.queueItems.length + 1;
        checkIn.queueNumber = queueNumber;
        await checkIn.save();

        queue.queueItems.push({
            checkInId: checkIn._id,
            patientId: patient._id,
            queueNumber,
            priority: checkInData.priorityLevel,
            status: 'checked-in',
            estimatedTime: new Date(Date.now() + (queueNumber * 15 * 60000)) // 15 min per patient
        });

        queue.stats.total += 1;
        queue.stats.waiting += 1;
        await queue.save();

        // Create ER triage if applicable
        if (department === 'ER' && triageData) {
            await ERTriage.create({
                checkInId: checkIn._id,
                patientId: patient._id,
                triageLevel: triageData.triageLevel || 'YELLOW',
                vitalSigns: triageData.vitalSigns || {},
                chiefComplaint: triageData.chiefComplaint || checkInReason,
                painLevel: triageData.painLevel,
                assessedBy: req.user._id,
                notes: triageData.notes
            });
        }

        // Populate and return
        const populatedCheckIn = await CheckIn.findById(checkIn._id)
            .populate('patientId', 'name patientId cnic contact')
            .populate('doctorId', 'name')
            .populate('createdBy', 'name');

        res.status(201).json({
            success: true,
            message: 'Patient checked in successfully',
            data: {
                checkInId: checkIn.checkInId,
                queueNumber,
                tokenNumber: checkIn.tokenNumber,
                wardBed: checkIn.wardBed,
                meetingLink: checkIn.meetingLink,
                checkIn: populatedCheckIn,
                department,
                status: 'checked-in'
            }
        });

    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({
            message: 'Server error during check-in',
            error: error.message
        });
    }
};

// @desc    Get department queue
// @route   GET /api/checkin/department/:dept
// @access  Private/Staff
const getDepartmentQueue = async (req, res) => {
    try {
        const { dept } = req.params;
        const { doctorId, date } = req.query;

        const queryDate = date ? new Date(date).setHours(0, 0, 0, 0) : new Date().setHours(0, 0, 0, 0);

        const query = {
            department: dept.toUpperCase(),
            date: queryDate,
            hospitalId: req.user.hospitalId || req.user._id
        };

        if (doctorId) query.doctorId = doctorId;

        const queues = await DepartmentQueue.find(query)
            .populate({
                path: 'queueItems.patientId',
                select: 'name patientId cnic contact'
            })
            .populate({
                path: 'queueItems.checkInId',
                select: 'checkInReason priorityLevel triageLevel tokenNumber status checkInTime'
            })
            .populate('doctorId', 'name')
            .sort({ createdAt: 1 });

        res.json({
            success: true,
            data: queues
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get patient check-ins
// @route   GET /api/checkin/patient/:id
// @access  Private
const getPatientCheckIns = async (req, res) => {
    try {
        const checkIns = await CheckIn.find({ patientId: req.params.id })
            .populate('doctorId', 'name')
            .populate('createdBy', 'name')
            .sort({ checkInTime: -1 });

        res.json({
            success: true,
            data: checkIns
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update check-in status
// @route   PUT /api/checkin/status/:id
// @access  Private/Staff/Doctor
const updateCheckInStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;

        const checkIn = await CheckIn.findById(req.params.id);
        if (!checkIn) {
            return res.status(404).json({ message: 'Check-in not found' });
        }

        const oldStatus = checkIn.status;
        checkIn.status = status;
        if (notes) checkIn.notes = notes;
        if (status === 'completed') {
            checkIn.completedAt = Date.now();
        }
        await checkIn.save();

        // Update queue stats
        const queue = await DepartmentQueue.findOne({
            'queueItems.checkInId': checkIn._id
        });

        if (queue) {
            const queueItem = queue.queueItems.find(
                item => item.checkInId.toString() === checkIn._id.toString()
            );

            if (queueItem) {
                queueItem.status = status;

                // Update stats
                if (oldStatus === 'checked-in' && queue.stats.waiting > 0) queue.stats.waiting -= 1;
                if (oldStatus === 'in-progress' && queue.stats.inProgress > 0) queue.stats.inProgress -= 1;

                if (status === 'in-progress') queue.stats.inProgress += 1;
                if (status === 'completed') queue.stats.completed += 1;

                await queue.save();
            }
        }

        res.json({
            success: true,
            message: 'Status updated successfully',
            data: checkIn
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get queue statistics
// @route   GET /api/checkin/stats
// @access  Private/Staff
const getQueueStats = async (req, res) => {
    try {
        const today = new Date().setHours(0, 0, 0, 0);

        const stats = await DepartmentQueue.aggregate([
            {
                $match: {
                    date: new Date(today),
                    hospitalId: req.user.hospitalId || req.user._id
                }
            },
            {
                $group: {
                    _id: '$department',
                    total: { $sum: '$stats.total' },
                    waiting: { $sum: '$stats.waiting' },
                    inProgress: { $sum: '$stats.inProgress' },
                    completed: { $sum: '$stats.completed' }
                }
            }
        ]);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    checkInPatient,
    getDepartmentQueue,
    getPatientCheckIns,
    updateCheckInStatus,
    getQueueStats
};
