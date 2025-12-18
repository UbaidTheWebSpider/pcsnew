const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@hospital.com'; // Replace with valid admin email
const ADMIN_PASSWORD = 'password123';     // Replace with valid admin password

async function testDoctorFlow() {
    try {
        console.log('1. Logging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        const token = loginRes.data.token;
        console.log('   Success! Token received.');

        console.log('\n2. Creating a new Doctor...');
        const doctorData = {
            name: 'Test Doctor',
            email: `doctor${Date.now()}@test.com`,
            password: 'password123',
            specialization: 'Cardiology',
            contact: { phone: '1234567890', address: '123 Test St' },
            // Profile Data
            gender: 'Male',
            dob: '1980-01-01',
            qualification: 'MBBS, MD',
            experience: 10,
            licenseNumber: `LIC-${Date.now()}`,
            department: 'Cardiology',
            employmentType: 'Full-time',
            scheduleSettings: {
                slotDuration: 30,
                weeklyAvailability: [
                    { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true }
                ]
            },
            consultationFees: { physical: 100, online: 80 },
            telemedicine: { isEnabled: true, platform: 'BigBlueButton' }
        };

        const createRes = await axios.post(`${API_URL}/users/doctors`, doctorData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const doctorId = createRes.data._id;
        console.log(`   Success! Doctor created with ID: ${doctorId}`);

        console.log('\n3. Fetching Doctor List...');
        const listRes = await axios.get(`${API_URL}/users/doctors`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const createdDoctor = listRes.data.find(d => d._id === doctorId);
        if (createdDoctor && createdDoctor.profile) {
            console.log('   Success! Doctor found with profile data.');
        } else {
            console.error('   Failed! Doctor profile missing in list.');
        }

        console.log('\n4. Deleting Doctor...');
        await axios.delete(`${API_URL}/users/${doctorId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Success! Doctor deleted.');

        console.log('\nTest Completed Successfully!');

    } catch (error) {
        console.error('\nTest Failed:', error.response ? error.response.data : error.message);
    }
}

testDoctorFlow();
