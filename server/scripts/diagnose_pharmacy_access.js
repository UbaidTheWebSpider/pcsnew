const mongoose = require('mongoose');
const User = require('../models/User');
const PharmacyUser = require('../models/PharmacyUser');
require('dotenv').config();

const diagnoseAllUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        console.log('\n--- Checking All Users for Pharmacy Associations ---');
        // Find all users
        const users = await User.find({});

        for (const user of users) {
            const association = await PharmacyUser.findOne({ userId: user._id });

            // Only log interesting cases (pharmacy role OR has association OR is admin)
            if (user.role === 'pharmacy' || user.role === 'hospital_admin' || association) {
                console.log(`\nUser: ${user.name} | Role: ${user.role} | Email: ${user.email} | ID: ${user._id}`);

                if (association) {
                    console.log(`   ✅ Association Found:`);
                    console.log(`      - Pharmacy Role: ${association.pharmacyRole}`);
                    console.log(`      - Status: ${association.status}`);
                    console.log(`      - Pharmacy ID: ${association.pharmacyId}`);
                } else {
                    console.log(`   ❌ NO Association Found`);
                    if (user.role === 'pharmacy') console.log(`      [CRITICAL] User has 'pharmacy' role but no association!`);
                    if (user.role === 'hospital_admin') console.log(`      [WARNING] User is admin. Does not have pharmacy access.`);
                }
            }
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

diagnoseAllUsers();
