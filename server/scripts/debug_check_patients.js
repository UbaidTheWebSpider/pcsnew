import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const login = async () => {
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'testadmin1@mail.com',
            password: 'password123'
        });
        return res.data.token;
    } catch (err) {
        console.error('Login failed:', err.response?.data || err.message);
        process.exit(1);
    }
};

const checkPatients = async (token) => {
    try {
        console.log('Fetching patients...');
        const res = await axios.get(`${API_URL}/staff/patients?page=1&limit=10`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Response Status:', res.status);
        console.log('Response Data keys:', Object.keys(res.data));
        if (res.data.data) {
            console.log('Data keys:', Object.keys(res.data.data));
            const patients = res.data.data.patients || res.data.data;
            console.log('Patients count:', Array.isArray(patients) ? patients.length : 'Not an array');
            if (Array.isArray(patients) && patients.length > 0) {
                console.log('First patient sample:', JSON.stringify(patients[0], null, 2));
            } else {
                console.log('Patients array is empty!');
            }
        }
    } catch (err) {
        console.error('Fetch patients failed:', err.response?.data || err.message);
    }
};

const run = async () => {
    const token = await login();
    await checkPatients(token);
};

run();
