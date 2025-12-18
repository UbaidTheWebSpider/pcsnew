const Patient = require('../models/Patient');
const ConsentLog = require('../models/ConsentLog');
const AccessLog = require('../models/AccessLog');
const mpiService = require('../services/mpiService');
const QRCode = require('qrcode');
const crypto = require('crypto');

// --- Helper: Health ID Generation ---
const generateHealthID = async () => {
    // ID Format: HID-Year-RandomString (e.g., HID-2024-X9Y2Z)
    const year = new Date().getFullYear();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `HID-${year}-${random}`;
};

// --- Controller Methods ---

/**
 * @desc    Check for duplicate patients using MPI
 * @route   POST /api/patients/check-duplicates
 * @access  Private (Staff/Admin)
 */
exports.checkForDuplicates = async (req, res) => {
    try {
        const { name, cnic, dateOfBirth, gender } = req.body;
        const matches = await mpiService.checkDuplicates({ name, cnic, dateOfBirth, gender });

        res.status(200).json({
            matches,
            isSafe: matches.length === 0
        });
    } catch (error) {
        console.error('MPI Check Error:', error);
        res.status(500).json({ message: 'Error checking for duplicates' });
    }
};

/**
 * @desc    Generate Digital Health ID and QR for a patient
 * @route   POST /api/patients/:id/generate-health-id
 * @access  Private (Admin/Staff)
 */
exports.generateDigitalHealthId = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        if (!patient.healthId) {
            patient.healthId = await generateHealthID();
        }

        // Generate QR Code containing the Health ID and Basic Info URL
        // In a real app, this URL would point to a verify endpoint
        const qrData = JSON.stringify({
            hid: patient.healthId,
            pid: patient.patientId,
            n: patient.name
        });

        const qrCodeUrl = await QRCode.toDataURL(qrData);
        patient.healthCardQr = qrCodeUrl;

        // Use current date if not already set, or update if re-issuing
        patient.healthCardIssueDate = new Date();

        await patient.save();

        res.status(200).json({
            healthId: patient.healthId,
            qrCode: qrCodeUrl
        });
    } catch (error) {
        console.error('Health ID Gen Error:', error);
        res.status(500).json({ message: 'Error generating health ID' });
    }
};

/**
 * @desc    Log Patient Consent
 * @route   POST /api/patients/:id/consent
 * @access  Private (Patient/Admin)
 */
exports.updateConsent = async (req, res) => {
    try {
        const { action, scope, details } = req.body;
        // Validate inputs
        if (!['GRANT', 'REVOKE'].includes(action)) return res.status(400).json({ message: 'Invalid action' });

        const consent = await ConsentLog.create({
            patientId: req.params.id,
            action,
            scope,
            details,
            actorId: req.user._id, // Assumes auth middleware
            ipAddress: req.ip
        });

        // Update latest consent reference in Patient model
        await Patient.findByIdAndUpdate(req.params.id, {
            consentId: consent._id
        });

        res.status(200).json({ message: 'Consent logged successfully', consent });
    } catch (error) {
        console.error('Consent Log Error:', error);
        res.status(500).json({ message: 'Error logging consent' });
    }
};

/**
 * @desc    Get Patient Entitlements (Hierarchy Logic)
 * @route   GET /api/patients/:id/entitlements
 * @access  Private
 */
exports.getEntitlements = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id).populate('entitlements.linkedDependents', 'name age relation');
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        let entitlementStatus = {
            status: patient.entitlements?.status || 'active',
            plan: patient.entitlements?.planType || 'general',
            coverage: 'Standard Coverage',
            dependents: patient.entitlements?.linkedDependents || []
        };

        // Rule-Based Logic (Entitlement Engine)
        if (patient.age >= 60) {
            entitlementStatus.plan = 'pensioner';
            entitlementStatus.coverage = 'Full Coverage (Senior Citizen)';
        } else if (patient.entitlements?.planType === 'employee') {
            entitlementStatus.coverage = 'Corporate Coverage';
        }

        res.status(200).json(entitlementStatus);
    } catch (error) {
        console.error('Entitlement Error:', error);
        res.status(500).json({ message: 'Error fetching entitlements' });
    }
};
