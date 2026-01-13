const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const StaffPatient = require('../models/StaffPatient');
const User = require('../models/User');
const Patient = require('../models/Patient');

async function debugFindHammad() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        console.log('\nSearching for Hammad in StaffPatient:');
        const hammadSP = await StaffPatient.find({ 'personalInfo.fullName': /Hammad/i });
        console.log(`Found ${hammadSP.length} records in StaffPatient`);
        hammadSP.forEach(p => console.log(`- ${p.personalInfo.fullName} (HID: ${p.healthId}, Hosp: ${p.hospitalId})`));

        console.log('\nSearching for Hammad in User:');
        const hammadUser = await User.find({ name: /Hammad/i });
        console.log(`Found ${hammadUser.length} records in User`);
        hammadUser.forEach(u => console.log(`- ${u.name} (HID: ${u.healthId}, Role: ${u.role})`));

        console.log('\nSearching for Hammad in Patient (Unified):');
        const hammadP = await Patient.find({ name: /Hammad/i });
        console.log(`Found ${hammadP.length} records in Patient`);
        hammadP.forEach(p => console.log(`- ${p.name} (HID: ${p.healthId}, Hosp: ${p.hospitalId})`));

        console.log('\nSearching for Health ID starting with MKC:');
        const mkcRecords = await StaffPatient.find({ healthId: /^HID-MKC/i });
        console.log(`Found ${mkcRecords.length} records starting with MKC in StaffPatient`);
        mkcRecords.forEach(p => console.log(`- ${p.personalInfo.fullName} (HID: ${p.healthId})`));

        // Let's also check the Patient collection for MKC
        const mkcP = await Patient.find({ healthId: /^HID-MKC/i });
        console.log(`Found ${mkcP.length} records starting with MKC in Patient`);
        mkcP.forEach(p => console.log(`- ${p.name} (HID: ${p.healthId})`));

        await mongoose.disconnect();
    } catch (error) {
        console.error('Debug Error:', error);
    }
}

debugFindHammad();
