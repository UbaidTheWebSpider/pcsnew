const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Admission = require('../models/Admission');
const Bed = require('../models/Bed');
require('dotenv').config();
const connectDB = require('../config/db');

const testAdmission = async () => {
    try {
        await connectDB();
        console.log('Connected to database');

        // Clean up test data
        await Patient.deleteMany({ cnic: '1234567890123' });
        await Admission.deleteMany({ 'emergencyContact.phone': '0300-1234567' });

        // Create a test patient via admission workflow
        const testData = {
            firstName: 'John',
            lastName: 'Doe',
            fatherName: 'James Doe',
            gender: 'male',
            cnic: '1234567890123',
            phone: '0333-9876543',
            dateOfBirth: new Date('1990-01-01'),
            address: '123 Test Street',
            admissionType: 'Emergency',
            admissionReason: 'Test admission for workflow verification',
            department: 'General',
            ward: 'General Ward',
            assignedDoctorId: new mongoose.Types.ObjectId(),
            emergencyContactName: 'Jane Doe',
            emergencyContactRelation: 'Sister',
            emergencyContactPhone: '0300-1234567',
            primaryDiagnosis: 'Test diagnosis',
            allergies: 'Penicillin, Pollen',
            bloodGroup: 'O+'
        };

        const name = `${testData.firstName} ${testData.lastName}`;

        // Create patient
        const patient = await Patient.create({
            name,
            fatherName: testData.fatherName,
            cnic: testData.cnic,
            gender: testData.gender.toLowerCase(),
            dateOfBirth: testData.dateOfBirth,
            contact: { phone: testData.phone, address: testData.address },
            emergencyContact: {
                name: testData.emergencyContactName,
                relation: testData.emergencyContactRelation,
                phone: testData.emergencyContactPhone
            },
            bloodGroup: testData.bloodGroup,
            assignedDoctorId: testData.assignedDoctorId
        });

        console.log('✓ Patient created successfully');
        console.log('  Patient ID:', patient.patientId);
        console.log('  Name:', patient.name);
        console.log('  Father Name:', patient.fatherName);
        console.log('  CNIC:', patient.cnic);

        // Create or find bed
        let bed = await Bed.findOne({ ward: testData.ward, isOccupied: false });
        if (!bed) {
            const bedCount = await Bed.countDocuments({ ward: testData.ward });
            bed = await Bed.create({
                ward: testData.ward,
                department: testData.department,
                bedNumber: `${testData.ward}-${bedCount + 1}`,
                isOccupied: false
            });
        }

        // Create admission
        const admission = await Admission.create({
            patientId: patient._id,
            type: testData.admissionType,
            reason: testData.admissionReason,
            department: testData.department,
            ward: testData.ward,
            bedNumber: bed.bedNumber,
            assignedDoctorId: testData.assignedDoctorId,
            emergencyContact: {
                name: testData.emergencyContactName,
                relation: testData.emergencyContactRelation,
                phone: testData.emergencyContactPhone
            },
            medicalEssentials: {
                primaryDiagnosis: testData.primaryDiagnosis,
                allergies: testData.allergies.split(',').map(s => s.trim()),
                bloodGroup: testData.bloodGroup
            }
        });

        bed.isOccupied = true;
        bed.currentPatientId = patient._id;
        await bed.save();

        console.log('✓ Admission created successfully');
        console.log('  Admission ID:', admission.admissionId);
        console.log('  Bed Number:', bed.bedNumber);
        console.log('  Status:', admission.status);

        console.log('\n✓ ALL TESTS PASSED');
        process.exit(0);
    } catch (error) {
        console.error('✗ TEST FAILED:', error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`  - ${key}: ${error.errors[key].message}`);
            });
        }
        process.exit(1);
    }
};

testAdmission();
