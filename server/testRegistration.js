// Quick test script to verify hospital_staff registration works
const testRegistration = async () => {
    try {
        const response = await fetch('http://localhost:5001/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Test Hospital Staff',
                email: `staff_${Date.now()}@test.com`,
                password: 'test123456',
                role: 'hospital_staff'
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ SUCCESS! Hospital staff registration works!');
            console.log('User created:', data);
        } else {
            console.log('❌ FAILED! Error:', data.message);
        }
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }
};

testRegistration();
