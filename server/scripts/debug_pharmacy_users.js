const mongoose = require('mongoose');
const User = require('../models/User');
const PharmacyUser = require('../models/PharmacyUser');
const Pharmacy = require('../models/Pharmacy');
require('dotenv').config();

const debugPharmacyUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        console.log('\n--- ALL USERS ---');
        const users = await User.find({ role: 'pharmacy' });
        console.log(`Found ${users.length} users with role 'pharmacy'`);

        for (const user of users) {
            console.log(`\nUser: ${user.name} (${user.email}) ID: ${user._id}`);

            const pharmacyUser = await PharmacyUser.findOne({ userId: user._id });
            if (pharmacyUser) {
                console.log(`  LINKED to Pharmacy ID: ${pharmacyUser.pharmacyId}`);
                console.log(`  Role: ${pharmacyUser.pharmacyRole}`);
                console.log(`  Status: ${pharmacyUser.status}`);
                console.log(`  Deleted: ${pharmacyUser.isDeleted}`);

                const pharmacy = await Pharmacy.findById(pharmacyUser.pharmacyId);
                console.log(`  Pharmacy Name: ${pharmacy ? pharmacy.basicProfile.pharmacyName : 'UNKNOWN'}`);
            } else {
                console.log('  NO PHARMACY ASSOCIATION FOUND');
            }
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

debugPharmacyUsers();
