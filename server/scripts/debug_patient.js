const mongoose = require('mongoose');
const Patient = require('../models/Patient');
require('dotenv').config();
const connectDB = require('../config/db');

// Mock User model to avoid missing ref errors if strict
const User = require('../models/User');

const debugPatientCreation = async () => {
    try {
        await connectDB();

        console.log('--- Attempting to create patient ---');

        const patientData = {
            cnic: `TEST_${Date.now()}`,
            name: 'Test Patient Debug',
            dateOfBirth: new Date('1990-01-01'),
            gender: 'male',
            contact: { phone: '1234567890' },
            // Intentionally omitting patientId to test auto-generation
            hospitalId: new mongoose.Types.ObjectId(), // Fake ID
        };

        const patient = new Patient(patientData);
        console.log('Patient instance created. Patient ID before validate:', patient.patientId);

        await patient.validate();
        console.log('Validation passed. Patient ID after validate:', patient.patientId);

        // Cleanup not needed as we won't save if we just validate, but let's try save too
        await patient.save();
        console.log('Patient saved successfully.');

        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`- ${key}: ${error.errors[key].message}`);
            });
        }
        process.exit(1);
    }
};

debugPatientCreation();
