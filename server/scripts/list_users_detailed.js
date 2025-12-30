const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}).select('name email role');
        console.log('--- ALL USERS ---');
        users.forEach(u => {
            console.log(`${u.name} | ${u.email} | Role: ${u.role} | ID: ${u._id}`);
        });
        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

listUsers();
