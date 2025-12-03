const API_URL = 'http://127.0.0.1:5001/api/auth';

const testAuth = async () => {
    try {
        // 1. Register
        console.log('Testing Register...');
        const registerRes = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Patient',
                email: `patient_${Date.now()}@example.com`,
                password: 'password123',
                role: 'patient'
            })
        });
        const registerData = await registerRes.json();
        console.log('Register Status:', registerRes.status);
        console.log('Register Data:', registerData);

        if (!registerRes.ok) throw new Error(registerData.message);

        const token = registerData.token;

        // 2. Login
        console.log('\nTesting Login...');
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: registerData.email,
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);
        console.log('Login Data:', loginData);

        if (!loginRes.ok) throw new Error(loginData.message);

        // 3. Get Me
        console.log('\nTesting Get Me...');
        const meRes = await fetch(`${API_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const meData = await meRes.json();
        console.log('Get Me Status:', meRes.status);
        console.log('Get Me Data:', meData);

    } catch (error) {
        console.error('Error:', error);
    }
};

testAuth();
