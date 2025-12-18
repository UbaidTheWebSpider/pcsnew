const mongoose = require('mongoose');
const User = require('../models/User');
const Patient = require('../models/Patient');
const dotenv = require('dotenv');

dotenv.config();

const debugGetPatients = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Pick a staff member to simulate
        const staff = await User.findOne({ role: 'hospital_staff' });
        if (!staff) {
            console.log('No staff found.');
            return;
        }

        console.log(`Simulating request for Staff: ${staff.name} (${staff._id})`);
        console.log(`Hospital ID: ${staff.hospitalId}`);

        if (!staff.hospitalId) {
            console.log('Error: Staff has no hospitalId');
            return;
        }

        const hospitalId = staff.hospitalId;

        // 2. Exact Logic from Controller
        console.log('--- Executing Query Logic ---');

        // A. Fetch Users
        const userPatients = await User.find({
            role: 'patient',
            hospitalId: hospitalId
        }).select('-password').lean();
        console.log(`Found ${userPatients.length} User records.`);

        // B. Fetch Patients
        const patientRecords = await Patient.find({
            hospitalId: hospitalId
        }).lean();
        console.log(`Found ${patientRecords.length} Patient records.`);

        // C. Merge Logic
        const patientMap = new Map();
        patientRecords.forEach(patient => {
            if (patient.userId) {
                patientMap.set(patient.userId.toString(), patient);
            }
        });

        const mergedPatients = userPatients.map(user => {
            const patientData = patientMap.get(user._id.toString());
            if (patientData) {
                return { ...patientData, ...user, patientId: patientData.patientId || user._id.toString() };
            }
            return { ...user, patientId: user._id.toString() };
        });

        // D. Edge Case (Patients without User)
        patientRecords.forEach(patient => {
            if (!patient.userId || !patientMap.has(patient.userId.toString())) {
                mergedPatients.push({
                    ...patient,
                    _id: patient._id,
                    name: patient.name,
                    role: 'patient'
                });
            }
        });

        console.log(`--- Success! Merged Count: ${mergedPatients.length} ---`);

        if (mergedPatients.length > 0) {
            console.log('Sample Patient:', JSON.stringify(mergedPatients[0], null, 2));
        }

    } catch (error) {
        console.error('CRASH DURING EXECUTION:', error);
    } finally {
        await mongoose.disconnect();
    }
};

debugGetPatients();
