require('dotenv').config();
const mongoose = require('mongoose');
const StaffPatient = require('../models/StaffPatient');
const Patient = require('../models/Patient');
const PatientService = require('../services/patientService');

const migratePatients = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for Migration');

        const staffPatients = await StaffPatient.find({ isActive: true });
        console.log(`Found ${staffPatients.length} StaffPatients to migrate.`);

        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const sp of staffPatients) {
            try {
                // Check if patient already exists in correct collection (by CNIC or PatientID)
                const existing = await Patient.findOne({
                    $or: [
                        { cnic: sp.personalInfo.cnic },
                        { patientId: sp.patientId } // Preserving IDs is crucial
                    ]
                });

                if (existing) {
                    console.log(`Skipping ${sp.personalInfo.fullName} (${sp.patientId}) - Already exists.`);
                    skippedCount++;
                    continue;
                }

                // Transform Data
                // Note: PatientService.toUnifiedFormat expects a plain object structure matching the StaffPatient schema
                const unifiedData = PatientService.toUnifiedFormat(sp.toObject());

                // Explicitly set the _id to preserve references if possible, OR just preserve patientId
                // Preserving _id is risky if there are collisions, but StaffPatient _id might be used in Appointment refs.
                // For now, we will rely on PatientId string being the business key.
                unifiedData.patientId = sp.patientId;
                unifiedData.createdAt = sp.createdAt;
                unifiedData.updatedAt = sp.updatedAt;

                // Create new Patient record
                await Patient.create(unifiedData);
                console.log(`Migrated: ${sp.personalInfo.fullName}`);
                migratedCount++;

            } catch (err) {
                console.error(`Failed to migrate ${sp.patientId}:`, err.message);
                errorCount++;
            }
        }

        console.log('--- Migration Summary ---');
        console.log(`Total Found: ${staffPatients.length}`);
        console.log(`Migrated: ${migratedCount}`);
        console.log(`Skipped: ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);

        process.exit();

    } catch (error) {
        console.error('Migration Fatal Error:', error);
        process.exit(1);
    }
};

migratePatients();
