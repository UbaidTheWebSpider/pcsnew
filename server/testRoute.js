// Simple request test
const axios = require('axios');

async function testRoute() {
    try {
        // This should fail with auth error, not 404
        const response = await axios.post('http://localhost:5001/api/patient/appointments/join-consultation', {
            appointmentId: 'test123'
        });
        console.log('Response:', response.data);
    } catch (error) {
        console.log('Error status:', error.response?.status);
        console.log('Error message:', error.response?.data);
        console.log('Expected: 401 (auth error) or 400 (validation error)');
        console.log('If 404: route not loaded');
    }
}

testRoute();
