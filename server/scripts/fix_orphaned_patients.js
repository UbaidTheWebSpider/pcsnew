const mongoose = require('mongoose');
const User = require('../models/User');
const Patient = require('../models/Patient');
const dotenv = require('dotenv');

dotenv.config();

const fixPatients = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Find all staff members
        const staffMembers = await User.find({ role: 'hospital_staff' });
        console.log(`Found ${staffMembers.length} staff members.`);

        let fixedCount = 0;

        for (const staff of staffMembers) {
            if (!staff.hospitalId) {
                console.log(`Skipping staff ${staff.name} (No hospitalId)`);
                continue;
            }

            // 2. Find patients assigned to this staff's personal ID (The Bug)
            const orphanedPatients = await Patient.find({ hospitalId: staff._id });
            const orphanedUserPatients = await User.find({ role: 'patient', hospitalId: staff._id });

            if (orphanedPatients.length > 0 || orphanedUserPatients.length > 0) {
                console.log(`Found orphans for staff ${staff.name} (${staff._id}):`);
                console.log(`- Patient Records: ${orphanedPatients.length}`);
                console.log(`- User Records: ${orphanedUserPatients.length}`);
                console.log(`- Correct Hospital ID: ${staff.hospitalId}`);

                // 3. Fix Patient Records
                const pResult = await Patient.updateMany(
                    { hospitalId: staff._id },
                    { $set: { hospitalId: staff.hospitalId } }
                );

                // 4. Fix User Records
                const uResult = await User.updateMany(
                    { role: 'patient', hospitalId: staff._id },
                    { $set: { hospitalId: staff.hospitalId } }
                );

                console.log(`  > Updated ${pResult.modifiedCount} Patient records`);
                console.log(`  > Updated ${uResult.modifiedCount} User records`);
                fixedCount += pResult.modifiedCount + uResult.modifiedCount;
            }
        }

        console.log(`\nOperation Complete. Total records fixed: ${fixedCount}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

fixPatients();
