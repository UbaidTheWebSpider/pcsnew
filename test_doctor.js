const API_URL = 'http://127.0.0.1:5001/api';

const testDoctor = async () => {
    try {
        // 1. Register Doctor (if not exists, or login)
        // For simplicity, let's register a new one to be sure
        const docEmail = `doctor_${Date.now()}@hospital.com`;
        console.log('Registering Doctor...');
        const docRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Dr. Strange',
                email: docEmail,
                password: 'password123',
                role: 'doctor',
                specialization: 'Surgeon'
            })
        });
        const docData = await docRes.json();
        if (!docRes.ok) throw new Error(docData.message);
        const docToken = docData.token;
        console.log('Doctor Registered:', docData.email);

        // 2. Register Patient
        const patEmail = `patient_${Date.now()}@hospital.com`;
        console.log('\nRegistering Patient...');
        const patRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Peter Parker',
                email: patEmail,
                password: 'password123',
                role: 'patient'
            })
        });
        const patData = await patRes.json();
        if (!patRes.ok) throw new Error(patData.message);
        const patToken = patData.token;
        console.log('Patient Registered:', patData.email);

        // 3. Book Appointment (as Patient)
        console.log('\nBooking Appointment...');
        const apptRes = await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${patToken}`
            },
            body: JSON.stringify({
                doctorId: docData._id,
                hospitalId: docData._id, // Just using doc ID as hospital ID for now since schema requires it
                date: new Date().toISOString()
            })
        });
        const apptData = await apptRes.json();
        if (!apptRes.ok) throw new Error(apptData.message);
        console.log('Appointment Booked:', apptData._id);

        // 4. Get Doctor Appointments
        console.log('\nFetching Doctor Appointments...');
        const getApptRes = await fetch(`${API_URL}/appointments/doctor`, {
            headers: { 'Authorization': `Bearer ${docToken}` }
        });
        const appts = await getApptRes.json();
        console.log('Appointments Count:', appts.length);

        // 5. Update Status
        console.log('\nUpdating Appointment Status...');
        const updateRes = await fetch(`${API_URL}/appointments/${apptData._id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${docToken}`
            },
            body: JSON.stringify({ status: 'completed' })
        });
        const updateData = await updateRes.json();
        console.log('Status Updated:', updateData.status);

    } catch (error) {
        console.error('Error:', error);
    }
};

testDoctor();
