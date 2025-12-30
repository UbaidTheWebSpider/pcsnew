const mongoose = require('mongoose');
const User = require('../models/User');
const PharmacyUser = require('../models/PharmacyUser');
require('dotenv').config();

const checkSpecificUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'ubaid.ms.008@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User ${email} not found.`);
        } else {
            console.log(`User: ${user.name} | ID: ${user._id} | Role: ${user.role}`);
            const association = await PharmacyUser.findOne({ userId: user._id });
            if (association) {
                console.log(`Association Found:`);
                console.log(`- Role: ${association.pharmacyRole}`);
                console.log(`- Status: ${association.status}`);
                console.log(`- isDeleted: ${association.isDeleted}`);
            } else {
                console.log(`No Association Found.`);
            }
        }
        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkSpecificUser();
