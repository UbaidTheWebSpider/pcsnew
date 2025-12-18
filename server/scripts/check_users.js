const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Find users that might be staff
        // We look for roles containing 'staff' or 'admin' just in case
        const users = await User.find({}, 'name email role hospitalId');

        console.log('--- User List ---');
        users.forEach(user => {
            console.log(`Name: ${user.name}, Email: ${user.email}, Role: '${user.role}'`);
        });
        console.log('-----------------');

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkUsers();
