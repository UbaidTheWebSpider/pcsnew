const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Prescription = require('../models/Prescription');
// Ensure User model is loaded for populate
const User = require('../models/User');

const checkPrescription = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const id = '697ca65fdb9e595ef2f75e04';
        console.log(`Checking Prescription ID: ${id}`);

        // Find by _id
        const prescription = await Prescription.findById(id)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name');

        if (prescription) {
            console.log('FOUND Prescription:');
            console.log(JSON.stringify(prescription, null, 2));
        } else {
            console.log('NOT FOUND via findById');
            // Check if ID is even valid ObjectId format
            const isValid = mongoose.Types.ObjectId.isValid(id);
            console.log(`Is Valid ObjectId: ${isValid}`);

            // List first 5 prescriptions to see Format
            const others = await Prescription.find().limit(5);
            console.log('Sample Prescriptions:');
            others.forEach(p => console.log(`- ${p._id} (RX: ${p.prescriptionId})`));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkPrescription();
