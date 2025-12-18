const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const fixStaffHospitalIds = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Find a Hospital Admin
        const hospitalAdmin = await User.findOne({ role: 'hospital_admin' });

        if (!hospitalAdmin) {
            console.log('No Hospital Admin found. Cannot link staff.');
            process.exit(1);
        }

        console.log(`Using Hospital Admin: ${hospitalAdmin.name} (${hospitalAdmin._id})`);

        // 2. Find ALL Staff
        const allStaff = await User.find({ role: 'hospital_staff' });
        console.log(`Found ${allStaff.length} TOTAL staff members.`);

        for (const staff of allStaff) {
            console.log(`- Name: ${staff.name}, ID: ${staff._id}, Current HospitalID: ${staff.hospitalId}`);
        }

        // 3. FORCE UPDATE ALL STAFF to this hospital
        if (allStaff.length > 0) {
            const result = await User.updateMany(
                { role: 'hospital_staff' },
                { $set: { hospitalId: hospitalAdmin._id } }
            );
            console.log(`SUCCESS: Updated ${result.modifiedCount} staff members to hospital ${hospitalAdmin._id}`);
        } else {
            console.log('No staff members found to update.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

fixStaffHospitalIds();
