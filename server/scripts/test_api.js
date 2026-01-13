const axios = require('axios');

async function testApi() {
    try {
        const response = await axios.get('http://localhost:5000/api/staff/patients', {
            params: { search: 'HID-MKCD1HI2-85608A' },
            headers: {
                // We might need a real token here if it's protected
                'Authorization': `Bearer ${process.env.TEST_TOKEN}`
            }
        });
        console.log('API Response:', response.data);
    } catch (error) {
        console.error('API Error Status:', error.response?.status);
        console.error('API Error Data:', JSON.stringify(error.response?.data, null, 2));
    }
}

// Since I don't have a token, this might fail with 401, but at least I can see if it hits the controller.
testApi();
