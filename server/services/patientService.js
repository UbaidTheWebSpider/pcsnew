const Patient = require('../models/Patient');
const StaffPatient = require('../models/StaffPatient');
const User = require('../models/User');

class PatientService {
    /**
     * Standardize Patient Data from Staff Format to Unified Format
     * Adapter Pattern to handle the schema difference between StaffPatient and Patient
     */
    static toUnifiedFormat(staffData) {
        return {
            name: staffData.personalInfo?.fullName,
            cnic: staffData.personalInfo?.cnic,
            gender: staffData.personalInfo?.gender?.toLowerCase(),
            dateOfBirth: staffData.personalInfo?.dateOfBirth,
            bloodGroup: staffData.personalInfo?.bloodGroup,
            photoUrl: staffData.personalInfo?.photoUrl,

            contact: {
                phone: staffData.contactInfo?.mobileNumber,
                email: staffData.contactInfo?.email,
                address: staffData.contactInfo?.address,
                city: staffData.contactInfo?.city,
                province: staffData.contactInfo?.province
            },

            emergencyContact: {
                name: staffData.contactInfo?.emergencyContact?.name,
                relation: staffData.contactInfo?.emergencyContact?.relation,
                phone: staffData.contactInfo?.emergencyContact?.phone
            },

            patientType: staffData.admissionDetails?.patientType || 'OPD',
            admissionDetails: {
                department: staffData.admissionDetails?.department,
                visitReason: staffData.admissionDetails?.visitReason,
                assignedDoctorId: staffData.admissionDetails?.assignedDoctorId,
                admissionDate: staffData.admissionDetails?.admissionDate
            },

            allergies: staffData.medicalBackground?.allergies || [],
            chronicDiseases: staffData.medicalBackground?.chronicDiseases || [],
            notes: staffData.medicalBackground?.notes ? [{ note: staffData.medicalBackground.notes }] : [],

            hospitalId: staffData.hospitalId,
            createdBy: staffData.createdBy
        };
    }

    /**
     * Register a new patient (Unified)
     */
    static async registerPatient(data, createdByUserId, hospitalId) {
        // 1. Check for duplicates (Atomic check via unique index happens on save, but we can check existing active 
        // accounts to return better error messages or allow "reactivation")

        // 2. Prepare Data
        const unifiedData = this.toUnifiedFormat({
            ...data,
            createdBy: createdByUserId,
            hospitalId: hospitalId
        });

        // 3. Create Record
        try {
            const patient = await Patient.create(unifiedData);
            return patient;
        } catch (error) {
            if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Duplicate Entry: A patient with this ${field} already exists.`);
            }
            throw error;
        }
    }

    /**
     * Get Patients for Hospital Staff (Data Projection Adapter)
     * Maps Unified Patient model back to the expected StaffPatient format for frontend compatibility
     */
    static async getHospitalPatients(hospitalId, queryParams) {
        try {
            const { search, department, type, page = 1, limit = 10 } = queryParams;

            // --- 1. Query Unified Patient Collection (Legacy/Admin) ---
            const patientQuery = { hospitalId, isDeleted: false };
            if (search) {
                patientQuery.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { cnic: { $regex: search, $options: 'i' } },
                    { 'contact.phone': { $regex: search, $options: 'i' } },
                    { patientId: { $regex: search, $options: 'i' } },
                    { healthId: { $regex: search, $options: 'i' } }
                ];
            }
            if (department) patientQuery['admissionDetails.department'] = department;
            if (type) patientQuery.patientType = type;

            const legacyPatients = await Patient.find(patientQuery).sort({ createdAt: -1 }).lean();

            // --- 2. Query StaffPatient Collection ---
            const staffQuery = { hospitalId, isActive: true };
            if (search) {
                staffQuery.$or = [
                    { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
                    { 'personalInfo.cnic': { $regex: search, $options: 'i' } },
                    { 'contactInfo.mobileNumber': { $regex: search, $options: 'i' } },
                    { patientId: { $regex: search, $options: 'i' } },
                    { healthId: { $regex: search, $options: 'i' } }
                ];
            }
            if (department) staffQuery['admissionDetails.department'] = department;
            if (type) staffQuery['admissionDetails.patientType'] = type;

            const staffPatients = await StaffPatient.find(staffQuery).sort({ createdAt: -1 }).lean();

            // --- 3. Merge and Map ---
            const mappedLegacy = legacyPatients.map(p => ({
                _id: p._id,
                patientId: p.patientId,
                personalInfo: {
                    fullName: p.name,
                    cnic: p.cnic,
                    gender: p.gender,
                    dateOfBirth: p.dateOfBirth,
                    bloodGroup: p.bloodGroup,
                    photoUrl: p.photoUrl
                },
                contactInfo: {
                    mobileNumber: p.contact?.phone,
                    email: p.contact?.email,
                    address: p.contact?.address
                },
                admissionDetails: p.admissionDetails,
                healthId: p.healthId,
                healthCardQr: p.healthCardQr,
                healthCardIssueDate: p.healthCardIssueDate,
                hospitalId: p.hospitalId,
                createdAt: p.createdAt,
                userId: p.userId,
                source: 'Patient'
            }));

            const mappedStaff = staffPatients.map(p => ({
                _id: p._id,
                patientId: p.patientId,
                personalInfo: p.personalInfo,
                contactInfo: p.contactInfo,
                admissionDetails: p.admissionDetails,
                healthId: p.healthId,
                healthCardQr: p.healthCardQr,
                healthCardIssueDate: p.healthCardIssueDate,
                hospitalId: p.hospitalId,
                createdAt: p.createdAt,
                userId: p.userId,
                source: 'StaffPatient'
            }));

            const combined = [...mappedLegacy, ...mappedStaff].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // --- 4. Populate missing Health IDs from User model ---
            const userIds = combined.map(p => p.userId).filter(id => id);
            if (userIds.length > 0) {
                const users = await User.find({ _id: { $in: userIds } }).select('healthId healthCardQr healthCardIssueDate').lean();
                const userMap = new Map(users.map(u => [u._id.toString(), u]));

                combined.forEach(p => {
                    if (p.userId) {
                        const user = userMap.get(p.userId.toString());
                        if (user) {
                            p.healthId = p.healthId || user.healthId;
                            p.healthCardQr = p.healthCardQr || user.healthCardQr;
                            p.healthCardIssueDate = p.healthCardIssueDate || user.healthCardIssueDate;
                        }
                    }
                });
            }

            const total = combined.length;
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const paginated = combined.slice(skip, skip + parseInt(limit));

            return {
                data: paginated,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / (limit || 10))
            };

        } catch (error) {
            console.error('CRITICAL DATABASE ERROR IN getHospitalPatients:');
            console.error('Error Details:', error);
            throw error;
        }
    }

    /**
     * Map Unified Patient to Staff Format (Single Object)
     */
    static toStaffFormat(p) {
        if (!p) return null;
        return {
            _id: p._id,
            patientId: p.patientId,
            personalInfo: {
                fullName: p.name,
                cnic: p.cnic,
                gender: p.gender,
                dateOfBirth: p.dateOfBirth,
                bloodGroup: p.bloodGroup,
                photoUrl: p.photoUrl
            },
            contactInfo: {
                mobileNumber: p.contact?.phone,
                email: p.contact?.email,
                address: p.contact?.address,
                emergencyContact: p.emergencyContact
            },
            admissionDetails: {
                patientType: p.patientType,
                department: p.admissionDetails?.department,
                assignedDoctorId: p.admissionDetails?.assignedDoctorId,
                visitReason: p.admissionDetails?.visitReason,
                admissionDate: p.admissionDetails?.admissionDate
            },
            medicalBackground: {
                allergies: p.allergies,
                chronicDiseases: p.chronicDiseases,
                notes: p.notes?.map(n => n.note).join('\n')
            },
            healthId: p.healthId,
            healthCardQr: p.healthCardQr,
            healthCardIssueDate: p.healthCardIssueDate,
            hospitalId: p.hospitalId,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            userId: p.userId,
            isActive: !p.isDeleted,
            source: 'Patient'
        };
    }

    /**
     * Get Single Patient by ID (Staff Format)
     */
    static async getPatientById(id) {
        // Try Patient model first
        let patient = await Patient.findById(id)
            .populate('admissionDetails.assignedDoctorId', 'name')
            .populate('createdBy', 'name')
            .lean();

        if (patient) {
            // MERGE: Pull Health ID from User if missing (Same as Admin logic)
            if (patient.userId) {
                const user = await User.findById(patient.userId).select('healthId healthCardQr healthCardIssueDate').lean();
                if (user) {
                    patient.healthId = patient.healthId || user.healthId;
                    patient.healthCardQr = patient.healthCardQr || user.healthCardQr;
                    patient.healthCardIssueDate = patient.healthCardIssueDate || user.healthCardIssueDate;
                }
            }
            return this.toStaffFormat(patient);
        }

        // Try StaffPatient model
        patient = await StaffPatient.findById(id)
            .populate('admissionDetails.assignedDoctorId', 'name')
            .populate('createdBy', 'name')
            .lean();

        if (patient) {
            // StaffPatient already has the correct structure for the most part
            return {
                ...patient,
                source: 'StaffPatient'
            };
        }

        return null;
    }

    /**
     * Update Patient (Staff Format Input)
     */
    static async updatePatient(id, staffUpdateData) {
        // 1. Convert Update Data to Unified Format
        // Note: We need to be careful not to overwrite missing fields with undefined
        // Ideally we should merge, but for now we re-use toUnifiedFormat which might need adjustment for partial updates.
        // A better approach for updates is flattening the object or handling specific fields.

        // Simpler approach: Map known fields manually for update to ensure safety
        const updatePayload = {};

        if (staffUpdateData.personalInfo) {
            if (staffUpdateData.personalInfo.fullName) updatePayload.name = staffUpdateData.personalInfo.fullName;
            if (staffUpdateData.personalInfo.cnic) updatePayload.cnic = staffUpdateData.personalInfo.cnic;
            if (staffUpdateData.personalInfo.gender) updatePayload.gender = staffUpdateData.personalInfo.gender.toLowerCase();
            if (staffUpdateData.personalInfo.dateOfBirth) updatePayload.dateOfBirth = staffUpdateData.personalInfo.dateOfBirth;
            if (staffUpdateData.personalInfo.bloodGroup) updatePayload.bloodGroup = staffUpdateData.personalInfo.bloodGroup;
        }

        if (staffUpdateData.contactInfo) {
            if (staffUpdateData.contactInfo.mobileNumber) updatePayload['contact.phone'] = staffUpdateData.contactInfo.mobileNumber;
            if (staffUpdateData.contactInfo.address) updatePayload['contact.address'] = staffUpdateData.contactInfo.address;
            if (staffUpdateData.contactInfo.emergencyContact) updatePayload.emergencyContact = staffUpdateData.contactInfo.emergencyContact;
        }

        // Add other fields as needed...

        const patient = await Patient.findByIdAndUpdate(id, { $set: updatePayload }, { new: true, runValidators: true });
        return this.toStaffFormat(patient);
    }

    /**
     * Soft Delete Patient
     */
    static async deletePatient(id) {
        return await Patient.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    }

    /**
     * Generate Health ID
     */
    static async generateHealthId(id) {
        const crypto = require('crypto');
        const patient = await Patient.findById(id);

        if (!patient) throw new Error('Patient not found');
        if (patient.healthId) throw new Error('Health ID already exists');

        // Generate unique Health ID
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = crypto.randomBytes(3).toString('hex').toUpperCase();
        const healthId = `HID-${timestamp}-${random}`;

        const qrData = JSON.stringify({
            hid: healthId,
            pid: patient.patientId,
            name: patient.name,
            issued: new Date().toISOString()
        });

        patient.healthId = healthId;
        patient.healthCardQr = qrData;
        patient.healthCardIssueDate = new Date();
        await patient.save();

        return { healthId, qrCode: qrData };
    }
}

module.exports = PatientService;
