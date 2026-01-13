const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const StaffPatient = require('../models/StaffPatient'); // Verify if it's in this collection too

const MONGO_URI = 'mongodb+srv://Vercel-Admin-telemedicine_db:RJQtw3IxQ2F3ekBI@telemedicine-db.xdkfugf.mongodb.net/?retryWrites=true&w=majority';

const findZia = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected!');

        console.log("Searching for 'Zia'...");

        // Search in Legacy Patients
        const legacyZia = await Patient.find({ name: { $regex: 'Zia', $options: 'i' } });
        console.log(`Found ${legacyZia.length} in 'Patient' collection:`);
        legacyZia.forEach(p => console.log(JSON.stringify({
            id: p._id,
            name: p.name,
            hospitalId: p.hospitalId,
            healthId: p.healthId,
            userId: p.userId
        }, null, 2)));

        // Search in Staff Patients
        const staffZia = await StaffPatient.find({ 'personalInfo.fullName': { $regex: 'Zia', $options: 'i' } });
        console.log(`Found ${staffZia.length} in 'StaffPatient' collection:`);
        staffZia.forEach(p => console.log(JSON.stringify({
            id: p._id,
            name: p.personalInfo.fullName,
            hospitalId: p.hospitalId,
            healthId: p.healthId
        }, null, 2)));

        process.exit(0);

    } catch (error) {
        console.error('Error finding Zia:', error);
        process.exit(1);
    }
};

findZia();
