const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const StaffPatient = require('../models/StaffPatient');
const User = require('../models/User');
const Patient = require('../models/Patient');

async function findAnywhere(term) {
    const regex = new RegExp(term, 'i');
    const collections = [
        { model: User, name: 'User' },
        { model: StaffPatient, name: 'StaffPatient' },
        { model: Patient, name: 'Patient' }
    ];

    for (const { model, name } of collections) {
        console.log(`\nSearching in ${name}...`);
        const results = await model.find({
            $or: [
                { name: regex },
                { 'personalInfo.fullName': regex },
                { healthId: regex },
                { patientId: regex },
                { cnic: regex },
                { 'personalInfo.cnic': regex }
            ]
        });
        console.log(`Found ${results.length} matches in ${name}`);
        results.forEach(r => {
            console.log(`- Match: ${r.name || r.personalInfo?.fullName} (HID: ${r.healthId}, ID: ${r._id})`);
        });
    }
}

async function start() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        await findAnywhere('Hammad');
        await findAnywhere('HID-MKC');
        await findAnywhere('85608A');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Debug Error:', error);
    }
}

start();
