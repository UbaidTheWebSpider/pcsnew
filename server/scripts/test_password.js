const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const testPassword = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/telemedicine_db');
        const usersToTest = ['doc@mail.com', 'ali@example.com', 'tanveer@mail.com', 'doctor@hospital.com'];
        for (const email of usersToTest) {
            const user = await User.findOne({ email });
            if (!user) {
                console.log(`User ${email} not found`);
            } else {
                const isMatch = await user.matchPassword('password123');
                console.log(`${email} password match (password123):`, isMatch);
            }
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

testPassword();
