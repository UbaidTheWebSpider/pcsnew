require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management';

// Function to generate a unique Health ID
function generateHealthId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `HID-${timestamp}-${random}`;
}

// Function to generate QR code data
function generateQRData(patient, healthId) {
    return JSON.stringify({
        hid: healthId,
        pid: patient._id.toString(),
        name: patient.email.split('@')[0],
        issued: new Date().toISOString()
    });
}

console.log('Connecting to:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        const patientsCollection = db.collection('patients');

        // Find all patients
        const patients = await usersCollection.find({ role: 'patient' }).toArray();
        console.log(`Found ${patients.length} patient(s)\n`);

        if (patients.length === 0) {
            console.log('❌ No patients found');
            process.exit(1);
        }

        // Assign Health IDs to first 5 patients (or all if less than 5)
        const patientsToUpdate = patients.slice(0, Math.min(5, patients.length));

        console.log(`📝 Assigning Health IDs to ${patientsToUpdate.length} patients...\n`);

        for (const patient of patientsToUpdate) {
            const healthId = generateHealthId();
            const qrData = generateQRData(patient, healthId);
            const issueDate = new Date();

            console.log(`👤 Patient: ${patient.email}`);
            console.log(`   Health ID: ${healthId}`);

            // Update in users collection
            await usersCollection.updateOne(
                { _id: patient._id },
                {
                    $set: {
                        healthId: healthId,
                        healthCardQr: qrData,
                        healthCardIssueDate: issueDate
                    }
                }
            );

            // Also update in patients collection if record exists
            const existingPatient = await patientsCollection.findOne({ userId: patient._id });

            if (existingPatient) {
                await patientsCollection.updateOne(
                    { userId: patient._id },
                    {
                        $set: {
                            healthId: healthId,
                            healthCardQr: qrData,
                            healthCardIssueDate: issueDate
                        }
                    }
                );
                console.log('   ✅ Updated in both collections\n');
            } else {
                console.log('   ✅ Updated in users collection\n');
            }
        }

        console.log('🎉 SUCCESS! Health IDs assigned');
        console.log(`\n📊 Summary:`);
        console.log(`   - Total patients: ${patients.length}`);
        console.log(`   - Patients with Health ID: ${patientsToUpdate.length}`);
        console.log(`   - Patients without Health ID: ${patients.length - patientsToUpdate.length}`);
        console.log('\n👉 Refresh your browser and go to /staff/health-cards');
        console.log('   You should see:');
        console.log(`   - ${patientsToUpdate.length} GREEN cards (with Health ID - can export)`);
        console.log(`   - ${patients.length - patientsToUpdate.length} GRAY cards (without Health ID)`);

        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });
