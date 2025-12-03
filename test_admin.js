const API_URL = 'http://127.0.0.1:5001/api';

const testAdmin = async () => {
    try {
        // 1. Register Admin
        console.log('Registering Admin...');
        const adminRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Hospital Admin',
                email: `admin_${Date.now()}@hospital.com`,
                password: 'password123',
                role: 'hospital_admin'
            })
        });
        const adminData = await adminRes.json();
        if (!adminRes.ok) throw new Error(adminData.message);
        const token = adminData.token;
        console.log('Admin Registered:', adminData.email);

        // 2. Add Doctor
        console.log('\nAdding Doctor...');
        const docRes = await fetch(`${API_URL}/users/doctors`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: 'Dr. House',
                email: `house_${Date.now()}@hospital.com`,
                password: 'password123',
                specialization: 'Diagnostician',
                contact: { phone: '1234567890' }
            })
        });
        const docData = await docRes.json();
        if (!docRes.ok) throw new Error(docData.message);
        console.log('Doctor Added:', docData.name);

        // 3. Add Pharmacy
        console.log('\nAdding Pharmacy...');
        const pharmRes = await fetch(`${API_URL}/users/pharmacies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: 'Central Pharmacy',
                email: `pharmacy_${Date.now()}@hospital.com`,
                password: 'password123',
                contact: { address: 'Building A' }
            })
        });
        const pharmData = await pharmRes.json();
        if (!pharmRes.ok) throw new Error(pharmData.message);
        console.log('Pharmacy Added:', pharmData.name);

        // 4. Get Doctors
        console.log('\nFetching Doctors...');
        const getDocsRes = await fetch(`${API_URL}/users/doctors`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const docs = await getDocsRes.json();
        console.log('Doctors Count:', docs.length);

        // 5. Get Pharmacies
        console.log('\nFetching Pharmacies...');
        const getPharmsRes = await fetch(`${API_URL}/users/pharmacies`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const pharms = await getPharmsRes.json();
        console.log('Pharmacies Count:', pharms.length);

    } catch (error) {
        console.error('Error:', error);
    }
};

testAdmin();
