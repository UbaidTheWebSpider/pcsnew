const mongoose = require('mongoose');
const User = require('../models/User');
const PharmacyUser = require('../models/PharmacyUser');
require('dotenv').config();

const simulateAuth = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'ph@mail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log("User not found");
            return;
        }

        const rolesAllowed = ['pharmacy_admin', 'pharmacist', 'cashier', 'inventory_manager', 'auditor'];

        console.log(`Checking user: ${user.email} (${user._id})`);

        const pharmacyUser = await PharmacyUser.findOne({
            userId: user._id,
            status: 'active',
            isDeleted: false
        });

        if (!pharmacyUser) {
            console.log("FAIL: No active pharmacy association found");
            process.exit(0);
        }

        console.log(`User Association Found. Role: ${pharmacyUser.pharmacyRole}`);

        if (!rolesAllowed.includes(pharmacyUser.pharmacyRole)) {
            console.log(`FAIL: Role ${pharmacyUser.pharmacyRole} not in allowed roles: ${rolesAllowed}`);
        } else {
            console.log("SUCCESS: Authorized");
        }

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

simulateAuth();
