const mongoose = require('mongoose');
const User = require('../models/User');
const StaffPatient = require('../models/StaffPatient');

// MongoDB Connection String
const MONGO_URI = 'mongodb+srv://Vercel-Admin-telemedicine_db:RJQtw3IxQ2F3ekBI@telemedicine-db.xdkfugf.mongodb.net/?retryWrites=true&w=majority';

const seedHealthCards = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected!');

        // 1. Find a Hospital Admin to act as Hospital
        let hospitalUser = await User.findOne({ role: 'hospital_admin' });

        // Specific fallback in case the role query misses or we want the specific one found in debug
        if (!hospitalUser) {
            hospitalUser = await User.findById('695b3edfeb4c0ce722b4d6da');
        }

        if (!hospitalUser) {
            console.error('No hospital_admin found. Cannot assign hospitalId.');
            process.exit(1);
        }

        const hospitalId = hospitalUser._id; // The admin IS the hospital usually in this schema
        console.log(`Using Hospital: ${hospitalUser.name} (ID: ${hospitalId})`);

        // 2. Define Sample Patients
        const samplePatients = [
            {
                patientId: `P-2025-${Math.floor(1000 + Math.random() * 9000)}`,
                personalInfo: {
                    fullName: 'Javed Iqbal',
                    cnic: `42101-${Math.floor(1000000 + Math.random() * 9000000)}-5`,
                    gender: 'Male',
                    dateOfBirth: new Date('1980-03-25'),
                    bloodGroup: 'A+',
                    photoUrl: 'https://randomuser.me/api/portraits/men/55.jpg'
                },
                contactInfo: {
                    mobileNumber: '0300-5556667',
                    address: 'Block 13-D, Gulshan-e-Iqbal, Karachi',
                    city: 'Karachi',
                    province: 'Sindh',
                    emergencyContact: {
                        name: 'Bilal',
                        phone: '0300-8889990',
                        relation: 'Brother'
                    }
                },
                admissionDetails: {
                    patientType: 'OPD',
                    department: 'Orthopedics',
                    assignedDoctorId: hospitalId, // Fallback to admin if no doctor
                    visitReason: 'Joint Pain'
                },
                medicalBackground: {
                    allergies: [],
                    chronicDiseases: ['Diabetes'],
                    currentMedications: ['Metformin']
                },
                healthId: `HID-${Math.floor(100000 + Math.random() * 900000)}`,
                healthCardQr: JSON.stringify({
                    id: `HID-${Math.floor(100000 + Math.random() * 900000)}`,
                    name: 'Javed Iqbal',
                    dob: '1980-03-25'
                }),
                healthCardIssueDate: new Date(),
                hospitalId: hospitalId,
                createdBy: hospitalId
            },
            {
                patientId: `P-2025-${Math.floor(1000 + Math.random() * 9000)}`,
                personalInfo: {
                    fullName: 'Fatima Noor',
                    cnic: `42101-${Math.floor(1000000 + Math.random() * 9000000)}-7`,
                    gender: 'Female',
                    dateOfBirth: new Date('1995-08-10'),
                    bloodGroup: 'B-',
                    photoUrl: 'https://randomuser.me/api/portraits/women/65.jpg'
                },
                contactInfo: {
                    mobileNumber: '0321-4445556',
                    address: 'DHA Phase 6, Karachi',
                    city: 'Karachi',
                    province: 'Sindh',
                    emergencyContact: {
                        name: 'Asad',
                        phone: '0321-7778889',
                        relation: 'Father'
                    }
                },
                admissionDetails: {
                    patientType: 'OPD',
                    department: 'Dermatology',
                    assignedDoctorId: hospitalId,
                    visitReason: 'Skin Rash'
                },
                medicalBackground: {
                    allergies: ['Dust'],
                    chronicDiseases: [],
                    currentMedications: []
                },
                healthId: `HID-${Math.floor(100000 + Math.random() * 900000)}`,
                healthCardQr: JSON.stringify({
                    id: `HID-${Math.floor(100000 + Math.random() * 900000)}`,
                    name: 'Fatima Noor',
                    dob: '1995-08-10'
                }),
                healthCardIssueDate: new Date(),
                hospitalId: hospitalId,
                createdBy: hospitalId
            }
        ];

        // 3. Insert Patients
        console.log('Inserting sample patients...');
        const result = await StaffPatient.insertMany(samplePatients);

        console.log('Successfully seeded patients:');
        result.forEach(p => {
            console.log(`- ${p.personalInfo.fullName} (Health ID: ${p.healthId})`);
        });

        console.log('Done!');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedHealthCards();
