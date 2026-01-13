/**
 * Utility functions for mapping StaffPatient model to display format
 */

/**
 * Maps StaffPatient model to simplified patient object for display
 * @param {Object} staffPatient - StaffPatient model object
 * @returns {Object} Mapped patient object
 */
export const mapStaffPatientToDisplay = (staffPatient) => {
    if (!staffPatient) return null;

    return {
        _id: staffPatient._id,
        patientId: staffPatient.patientId,
        name: staffPatient.name || staffPatient.personalInfo?.fullName || 'N/A',
        cnic: staffPatient.cnic || staffPatient.personalInfo?.cnic || 'N/A',
        gender: staffPatient.gender || staffPatient.personalInfo?.gender || 'N/A',
        dateOfBirth: staffPatient.dateOfBirth || staffPatient.personalInfo?.dateOfBirth,
        bloodGroup: staffPatient.bloodGroup || staffPatient.personalInfo?.bloodGroup,
        photoUrl: staffPatient.photoUrl || staffPatient.personalInfo?.photoUrl || null,
        age: (staffPatient.dateOfBirth || staffPatient.personalInfo?.dateOfBirth)
            ? calculateAge(staffPatient.dateOfBirth || staffPatient.personalInfo?.dateOfBirth)
            : null,
        email: staffPatient.contact?.email || staffPatient.contactInfo?.email || 'N/A',
        contact: {
            phone: staffPatient.contact?.phone || staffPatient.contactInfo?.mobileNumber || 'N/A',
            address: staffPatient.contact?.address || staffPatient.contactInfo?.address || 'N/A',
            email: staffPatient.contact?.email || staffPatient.contactInfo?.email || 'N/A'
        },
        emergencyContact: {
            name: staffPatient.emergencyContact?.name || staffPatient.contactInfo?.emergencyContact?.name || 'N/A',
            phone: staffPatient.emergencyContact?.phone || staffPatient.contactInfo?.emergencyContact?.phone || 'N/A',
            relation: staffPatient.emergencyContact?.relation || staffPatient.contactInfo?.emergencyContact?.relation || 'N/A'
        },
        // Health Card Fields
        healthId: staffPatient.healthId || null,
        healthCardQr: staffPatient.healthCardQr || null,
        healthCardIssueDate: staffPatient.healthCardIssueDate || null,
        // Other fields
        admissionDetails: staffPatient.admissionDetails,
        medicalBackground: staffPatient.medicalBackground,
        medicalInfo: staffPatient.medicalInfo || staffPatient.medicalBackground, // Alias for compatibility
        isActive: staffPatient.isActive,
        createdAt: staffPatient.createdAt,
        updatedAt: staffPatient.updatedAt
    };
};

/**
 * Maps array of StaffPatient models to display format
 * @param {Array} staffPatients - Array of StaffPatient model objects
 * @returns {Array} Array of mapped patient objects
 */
export const mapStaffPatientsToDisplay = (staffPatients) => {
    // Handle paginated response structure { patients: [], total: ... }
    if (staffPatients && staffPatients.patients && Array.isArray(staffPatients.patients)) {
        return staffPatients.patients.map(mapStaffPatientToDisplay);
    }

    if (!Array.isArray(staffPatients)) return [];
    return staffPatients.map(mapStaffPatientToDisplay);
};

/**
 * Calculate age from date of birth
 * @param {Date|string} dob - Date of birth
 * @returns {number} Age in years
 */
const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};
