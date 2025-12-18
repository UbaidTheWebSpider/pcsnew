const axios = require('axios');

const API_URL = 'http://localhost:5001/api';
const STAFF_EMAIL = 'staff@hospital.com'; // Adjust based on seed data
const STAFF_PASSWORD = 'password123';

async function testStaffPatientFlow() {
    try {
        console.log('1. Logging in as Staff...');
        // Note: You might need to adjust this if no staff user exists.
        // Falls back to creating a staff user if login fails (optional logic)
        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: STAFF_EMAIL,
                password: STAFF_PASSWORD
            });
            token = loginRes.data.token;
            console.log('   Success! Token received.');
        } catch (e) {
            console.log('   Login failed, attempting to register temp staff...');
            const regRes = await axios.post(`${API_URL}/auth/register`, {
                name: 'Temp Staff',
                email: `staff${Date.now()}@hospital.com`,
                password: 'password123',
                role: 'hospital_staff'
            });
            token = regRes.data.token;
            console.log('   Registered and logged in as temp staff.');
        }

        console.log('\n2. Registering a new Patient...');
        const patientData = {
            personalInfo: {
                fullName: 'Test Patient',
                gender: 'Male',
                dateOfBirth: '1990-01-01',
                cnic: `42101-${Date.now()}`
            },
            contactInfo: {
                mobileNumber: '03001234567',
                address: '123 Test Lane'
            },
            admissionDetails: {
                patientType: 'OPD',
                department: 'General'
            },
            medicalBackground: {
                allergies: ['Peanuts'],
                chronicDiseases: ['None'],
                currentMedications: []
            }
        };

        const createRes = await axios.post(`${API_URL}/staff/patients/register`, patientData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const patientId = createRes.data.data._id;
        console.log(`   Success! Patient created with DB ID: ${patientId}`);
        console.log(`   Generated Hospital Patient ID: ${createRes.data.data.patientId}`);

        console.log('\n3. Fetching Patient List...');
        const listRes = await axios.get(`${API_URL}/staff/patients`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const found = listRes.data.data.find(p => p._id === patientId);
        if (found) {
            console.log('   Success! Patient found in list.');
        } else {
            console.error('   Failed! Patient not in list.');
        }

        console.log('\n4. Deleting Patient...');
        await axios.delete(`${API_URL}/staff/patients/${patientId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Success! Patient deleted.');

        console.log('\nTest Completed Successfully!');

    } catch (error) {
        console.error('\nTest Failed:', error.response ? error.response.data : error.message);
    }
}

testStaffPatientFlow();
