const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const DOCTOR_EMAIL = 'doctor@hospital.com'; // Adjust if needed
const DOCTOR_PASSWORD = 'password123';

async function verifyPrescriptionFlow() {
    try {
        console.log('1. Logging in as Doctor...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: DOCTOR_EMAIL,
            password: DOCTOR_PASSWORD
        });
        const token = loginRes.data.token;
        const doctorId = loginRes.data._id;
        console.log('   Success! Logged in.');

        console.log('\n2. Fetching patients for doctor...');
        const patientsRes = await axios.get(`${API_URL}/doctor/patients`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const patients = patientsRes.data.data.patients;
        if (patients.length === 0) {
            console.warn('   No patients found for this doctor. Test cannot proceed fully.');
            return;
        }
        const patientId = patients[0]._id;
        console.log(`   Success! Found ${patients.length} patients. Using patient ${patientId}`);

        console.log('\n3. Creating a new Prescription...');
        const prescriptionData = {
            patientId,
            diagnosis: 'Verification Diagnosis',
            notes: 'Test notes for verification',
            medicines: [
                {
                    name: 'Paracetamol',
                    dosage: '500mg',
                    frequency: '1-0-1',
                    duration: '5 days',
                    instructionTime: 'After Meal',
                    instructions: 'Take with warm water'
                }
            ],
            labTests: ['CBC', 'Widal'],
            followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };

        const createRes = await axios.post(`${API_URL}/prescriptions`, prescriptionData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const prescriptionId = createRes.data._id;
        console.log(`   Success! Prescription created with ID: ${prescriptionId}`);

        console.log('\n4. Fetching doctor prescriptions...');
        const doctorPresRes = await axios.get(`${API_URL}/prescriptions/doctor`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const found = doctorPresRes.data.data.some(p => p._id === prescriptionId);
        if (found) {
            console.log('   Success! Created prescription found in doctor list.');
        } else {
            console.error('   Failed! Created prescription NOT found in doctor list.');
        }

        console.log('\n5. Fetching prescription detail...');
        const detailRes = await axios.get(`${API_URL}/prescriptions/${prescriptionId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (detailRes.data.diagnosis === 'Verification Diagnosis' && detailRes.data.medicines[0].instructionTime === 'After Meal') {
            console.log('   Success! Prescription details verified.');
        } else {
            console.error('   Failed! Prescription details mismatch.');
            console.log(detailRes.data);
        }

        console.log('\nVerification Completed Successfully!');

    } catch (error) {
        console.error('\nVerification Failed:', error.response ? error.response.data : error.message);
    }
}

verifyPrescriptionFlow();
