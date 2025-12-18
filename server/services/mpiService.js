const Fuse = require('fuse.js');
const MPIRecord = require('../models/MPIRecord');
const Patient = require('../models/Patient');

// Weights for similarity scoring
const MATCH_THRESHOLDS = {
    EXACT_CNIC: 1.0,
    HIGH_CONFIDENCE: 0.85, // Same name + DOB, or very close name + accurate Address
    POTENTIAL_DUPLICATE: 0.60
};

class MPIService {
    /**
     * Normalize string for better matching (remove special chars, lowercase)
     */
    normalize(str) {
        return str ? str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() : '';
    }

    /**
     * Create or Update MPI Record for a Patient
     * @param {Object} patient - The patient document
     */
    async syncPatientToMPI(patient) {
        const normalizedName = this.normalize(patient.name);
        const normalizedAddress = this.normalize(patient.contact?.address);

        await MPIRecord.findOneAndUpdate(
            { patientId: patient._id },
            {
                patientId: patient._id,
                normalizedName,
                normalizedAddress,
                cnic: patient.cnic ? patient.cnic.replace(/[^0-9]/g, '') : null,
                dob: patient.dateOfBirth,
                phone: patient.contact?.phone,
                lastUpdated: Date.now()
            },
            { upsert: true, new: true }
        );
    }

    /**
     * Check for potential duplicates using fuzzy logic
     * @param {Object} data - Candidate data { name, cnic, dob, gender }
     * @returns {Array} - List of potential matches with scores
     */
    async checkDuplicates(data) {
        const matches = [];

        // 1. Exact CNIC Match (Highest Priority)
        if (data.cnic) {
            const cleanCnic = data.cnic.replace(/[^0-9]/g, '');
            const cnicMatch = await MPIRecord.findOne({ cnic: cleanCnic }).populate('patientId', 'name contact dateOfBirth patientId');
            if (cnicMatch) {
                matches.push({
                    patient: cnicMatch.patientId,
                    score: MATCH_THRESHOLDS.EXACT_CNIC,
                    reason: 'Exact CNIC Match'
                });
                return matches; // Return immediately on exact ID match
            }
        }

        // 2. Fuzzy Name Match
        // We fetch candidates that are somewhat similar first (e.g. same soundex or regex) to limit Fuse.js scope
        // For simplicity in MongoDB, we can use $text search or just fetch a broad range if dataset is small.
        // For production scale, use aggregation pipeline or specialized search engine (Elastic).
        // Here we'll fetch recent records or search by partial name.

        let candidates = [];
        if (data.name) {
            const nameRegex = new RegExp(this.normalize(data.name).split(' ')[0], 'i'); // Match first name
            candidates = await MPIRecord.find({ normalizedName: nameRegex }).populate('patientId', 'name contact dateOfBirth patientId');
        }

        if (candidates.length === 0) return [];

        const fuseOptions = {
            includeScore: true,
            keys: ['normalizedName', 'phone'],
            threshold: 0.4 // 0.0 is exact match, 1.0 is no match. Fuse returns a "distance" score (lower is better).
        };

        const fuse = new Fuse(candidates, fuseOptions);
        const fuseResults = fuse.search(this.normalize(data.name));

        // Process fuse results
        for (const result of fuseResults) {
            // Invert Fuse score to get Similarity (0 to 1)
            // Fuse score: 0 = perfect, 1 = mismatch.
            let similarity = 1 - result.score;
            let record = result.item;

            // Boost score if DOB matches
            if (data.dateOfBirth && record.dob && new Date(data.dateOfBirth).getTime() === new Date(record.dob).getTime()) {
                similarity += 0.2;
            }

            if (similarity > 1.0) similarity = 1.0;

            if (similarity >= MATCH_THRESHOLDS.POTENTIAL_DUPLICATE) {
                matches.push({
                    patient: record.patientId,
                    score: parseFloat(similarity.toFixed(2)),
                    reason: similarity > MATCH_THRESHOLDS.HIGH_CONFIDENCE ? 'High Probability Match' : 'Potential Duplicate'
                });
            }
        }

        return matches.sort((a, b) => b.score - a.score);
    }
}

module.exports = new MPIService();
