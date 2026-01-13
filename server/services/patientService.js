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
        const { search, department, type, page = 1, limit = 10 } = queryParams;

        let query = { hospitalId, isActive: true };

        if (search) {
            query.$or = [
                { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
                { 'personalInfo.cnic': { $regex: search, $options: 'i' } },
                { 'contactInfo.mobileNumber': { $regex: search, $options: 'i' } },
                { patientId: { $regex: search, $options: 'i' } },
                { healthId: { $regex: search, $options: 'i' } }
            ];
        }

        if (department) query['admissionDetails.department'] = department;
        if (type) query['admissionDetails.patientType'] = type;

        const skip = (page - 1) * limit;
        const total = await StaffPatient.countDocuments(query);
        const patients = await StaffPatient.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('admissionDetails.assignedDoctorId', 'name specialization');

        // Map data to the format expected by the frontend (already in StaffPatient format mostly)
        const mappedPatients = patients.map(p => ({
            _id: p._id,
            patientId: p.patientId,
            personalInfo: p.personalInfo,
            contactInfo: p.contactInfo,
            admissionDetails: p.admissionDetails,
            medicalBackground: p.medicalBackground,
            healthId: p.healthId,
            healthCardQr: p.healthCardQr,
            healthCardIssueDate: p.healthCardIssueDate,
            hospitalId: p.hospitalId,
            createdAt: p.createdAt,
            isActive: p.isActive
        }));

        return {
            data: mappedPatients,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        };
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
            healthId: p.healthId,
            healthCardQr: p.healthCardQr,
            healthCardIssueDate: p.healthCardIssueDate,
            hospitalId: p.hospitalId,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            isActive: !p.isDeleted
        };
    }

    /**
     * Get Single Patient by ID (Staff Format)
     */
    static async getPatientById(id) {
        const patient = await Patient.findById(id)
            .populate('admissionDetails.assignedDoctorId', 'name')
            .populate('createdBy', 'name');

        return this.toStaffFormat(patient);
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
