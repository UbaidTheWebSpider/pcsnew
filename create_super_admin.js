require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./server/models/User'); // Adjust path as needed

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in .env');
    process.exit(1);
}

const createSuperAdmin = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'superadmin@example.com';
        const password = 'Password123';

        const existing = await User.findOne({ email });
        if (existing) {
            console.log('Super admin already exists with this email.');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name: 'Super Admin',
            email,
            password: hashedPassword,
            role: 'super_admin',
            isActive: true
        });

        console.log('--- SUPER ADMIN CREATED ---');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Role: super_admin');
        console.log('---------------------------');

    } catch (error) {
        console.error('Error creating super admin:', error);
    } finally {
        await mongoose.connection.close();
    }
};

createSuperAdmin();
