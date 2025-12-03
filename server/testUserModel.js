// Test script to verify User model accepts hospital_staff role
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const testUserModel = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        // Test creating a user with hospital_staff role
        const testUser = new User({
            name: 'Test Staff',
            email: `test_staff_${Date.now()}@test.com`,
            password: 'test123',
            role: 'hospital_staff'
        });

        // Validate the user
        await testUser.validate();
        console.log('✅ Validation passed for hospital_staff role');

        // Try to save
        await testUser.save();
        console.log('✅ User saved successfully with hospital_staff role');
        console.log('User ID:', testUser._id);

        // Clean up - delete the test user
        await User.findByIdAndDelete(testUser._id);
        console.log('✅ Test user deleted');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

testUserModel();
