const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/telemedicine_db');
        console.log('Connected to DB');

        const users = await User.find({}, 'name email role');
        console.log('--- USERS ---');
        console.table(users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));
        console.log('Total:', users.length);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

listUsers();
