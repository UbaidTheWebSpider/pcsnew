/**
 * Health ID Validation and Normalization Utility
 * Supports multiple ID formats and extraction from QR code data
 */

// Supported Health ID patterns
const HEALTH_ID_PATTERNS = {
    // Format: HID-XXXXX-XXXXX
    standard: /^HID-[A-Z0-9]+-[A-Z0-9]+$/i,
    // Format: P-YYYY-XXX
    patient: /^P-\d{4}-[A-Z0-9]+$/i,
    // Format: CNIC 12345-1234567-1
    cnic: /^\d{5}-\d{7}-\d$/,
    // Generic alphanumeric (fallback)
    generic: /^[A-Z0-9-]{5,30}$/i
};

/**
 * Validates if a string matches any known Health ID format
 * @param {string} id - The ID to validate
 * @returns {boolean}
 */
export const isValidHealthId = (id) => {
    if (!id || typeof id !== 'string') return false;

    const normalized = id.trim();
    return Object.values(HEALTH_ID_PATTERNS).some(pattern => pattern.test(normalized));
};

/**
 * Normalizes a Health ID (trim, uppercase where appropriate)
 * @param {string} id - The ID to normalize
 * @returns {string}
 */
export const normalizeHealthId = (id) => {
    if (!id) return '';

    let normalized = id.trim();

    // Uppercase for HID and Patient ID formats
    if (normalized.match(/^(HID|P)-/i)) {
        normalized = normalized.toUpperCase();
    }

    return normalized;
};

/**
 * Extracts Health ID from QR code data
 * Handles various QR data structures:
 * - Plain text ID
 * - JSON with 'id', 'hid', 'healthId', 'patientId' fields
 * - URL with ID parameter
 * 
 * @param {string} qrData - Raw QR code data
 * @returns {string|null} - Extracted and normalized ID, or null if invalid
 */
export const extractHealthId = (qrData) => {
    if (!qrData) return null;

    let extractedId = null;

    // Try parsing as JSON
    try {
        const parsed = JSON.parse(qrData);

        // Check common field names
        extractedId = parsed.id ||
            parsed.hid ||
            parsed.healthId ||
            parsed.patientId ||
            parsed.pid ||
            parsed.health_id ||
            parsed.patient_id;

    } catch (e) {
        // Not JSON, try other formats

        // Check if it's a URL with query parameters
        if (qrData.includes('?') || qrData.includes('&')) {
            try {
                const url = new URL(qrData.startsWith('http') ? qrData : `https://dummy.com${qrData}`);
                extractedId = url.searchParams.get('id') ||
                    url.searchParams.get('healthId') ||
                    url.searchParams.get('patientId');
            } catch (urlError) {
                // Not a valid URL
            }
        }

        // If still nothing, treat as plain text
        if (!extractedId) {
            extractedId = qrData.trim();
        }
    }

    if (!extractedId) return null;

    // Normalize and validate
    const normalized = normalizeHealthId(extractedId);
    return isValidHealthId(normalized) ? normalized : null;
};

/**
 * Validates barcode data and extracts patient identifier
 * @param {string} barcodeData - Raw barcode data
 * @returns {string|null}
 */
export const extractBarcodeId = (barcodeData) => {
    // Barcodes typically contain plain IDs
    // Apply same extraction logic as QR codes
    return extractHealthId(barcodeData);
};

/**
 * Determines the type of ID
 * @param {string} id - The ID to check
 * @returns {string} - 'health_id', 'patient_id', 'cnic', or 'unknown'
 */
export const getIdType = (id) => {
    if (!id) return 'unknown';

    const normalized = id.trim();

    if (HEALTH_ID_PATTERNS.standard.test(normalized)) return 'health_id';
    if (HEALTH_ID_PATTERNS.patient.test(normalized)) return 'patient_id';
    if (HEALTH_ID_PATTERNS.cnic.test(normalized)) return 'cnic';

    return 'unknown';
};

export default {
    isValidHealthId,
    normalizeHealthId,
    extractHealthId,
    extractBarcodeId,
    getIdType
};
