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
        name: staffPatient.personalInfo?.fullName || 'N/A',
        cnic: staffPatient.personalInfo?.cnic || 'N/A',
        gender: staffPatient.personalInfo?.gender || 'N/A',
        dateOfBirth: staffPatient.personalInfo?.dateOfBirth,
        bloodGroup: staffPatient.personalInfo?.bloodGroup,
        age: staffPatient.personalInfo?.dateOfBirth
            ? calculateAge(staffPatient.personalInfo.dateOfBirth)
            : null,
        contact: {
            phone: staffPatient.contactInfo?.mobileNumber || 'N/A',
            address: staffPatient.contactInfo?.address || 'N/A',
            email: staffPatient.contactInfo?.email || 'N/A'
        },
        emergencyContact: {
            name: staffPatient.contactInfo?.emergencyContact?.name || 'N/A',
            phone: staffPatient.contactInfo?.emergencyContact?.phone || 'N/A',
            relation: staffPatient.contactInfo?.emergencyContact?.relation || 'N/A'
        },
        admissionDetails: staffPatient.admissionDetails,
        medicalBackground: staffPatient.medicalBackground,
        medicalInfo: staffPatient.medicalBackground, // Alias for compatibility
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
