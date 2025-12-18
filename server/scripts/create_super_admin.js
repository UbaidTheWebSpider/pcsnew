const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const createSuperAdmin = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const email = 'super@admin.com';
        const password = 'password123';

        // Check if exists
        let user = await User.findOne({ email });
        if (user) {
            console.log('User already exists. Updating role to super_admin...');
            user.role = 'super_admin';
            user.password = password; // Reset password to ensure they can login
            await user.save();
        } else {
            console.log('Creating new Super Admin user...');
            user = await User.create({
                name: 'Super Admin',
                email,
                password,
                role: 'super_admin'
            });
        }

        console.log('------------------------------------------------');
        console.log('Super Admin User Ready:');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('------------------------------------------------');
        process.exit(0);

    } catch (error) {
        console.error('Failed to create user:', error);
        process.exit(1);
    }
};

createSuperAdmin();
