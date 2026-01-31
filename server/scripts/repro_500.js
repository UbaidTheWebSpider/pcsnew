const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Prescription = require('../models/Prescription');
const User = require('../models/User');

const checkPrescription = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const id = '697ca65fdb9e595ef2f75e04';
        console.log(`Checking Prescription ID: ${id}`);

        console.log('--- Attempting Find with Populate ---');
        // Mimic the controller exactly
        const prescription = await Prescription.findById(id)
            .populate('patientId', 'name email contact')
            .populate('doctorId', 'name specialization')
            .populate('processedBy', 'name');

        if (!prescription) {
            console.log('Prescription not found (returned null)');
        } else {
            console.log('Prescription FOUND and Populated!');
            console.log('Patient:', prescription.patientId);
            console.log('Doctor:', prescription.doctorId);
            console.log('ProcessedBy:', prescription.processedBy);
        }

    } catch (error) {
        console.error('CRASHED DURING QUERY:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkPrescription();
