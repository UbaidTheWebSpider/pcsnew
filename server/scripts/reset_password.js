const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const resetPassword = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/telemedicine_db');
        const user = await User.findOne({ email: 'doc@mail.com' });
        if (!user) {
            console.log('User doc@mail.com not found');
        } else {
            user.password = 'password123';
            await user.save();
            console.log('Password for doc@mail.com reset to password123 successfully');
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

resetPassword();
