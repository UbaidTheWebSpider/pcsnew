require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management';

console.log('Connecting to:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Find admin user
        const adminUser = await usersCollection.findOne({ role: 'hospital_admin' });

        if (!adminUser) {
            console.log('❌ No admin user found');
            process.exit(1);
        }

        console.log(`✅ Found admin: ${adminUser.email}`);
        console.log(`   Admin ID: ${adminUser._id}\n`);

        // Find all patients
        const patients = await usersCollection.find({ role: 'patient' }).toArray();
        console.log(`Found ${patients.length} patient(s)\n`);

        if (patients.length === 0) {
            console.log('❌ No patients found in database');
            process.exit(1);
        }

        // Show current state
        console.log('=== CURRENT PATIENT HOSPITAL IDs ===');
        patients.forEach(p => {
            console.log(`${p.email}: ${p.hospitalId || 'NOT SET'}`);
        });

        // Update all patients to have the admin's hospitalId
        console.log('\n📝 Updating all patients...\n');

        const result = await usersCollection.updateMany(
            { role: 'patient' },
            { $set: { hospitalId: adminUser._id } }
        );

        console.log(`✅ Updated ${result.modifiedCount} patient(s)`);

        // Verify
        const updatedPatients = await usersCollection.find({ role: 'patient' }).toArray();
        console.log('\n=== UPDATED PATIENT HOSPITAL IDs ===');
        updatedPatients.forEach(p => {
            console.log(`${p.email}: ${p.hospitalId}`);
        });

        console.log('\n🎉 SUCCESS! All patients now belong to the admin\'s hospital');
        console.log('\n👉 Refresh your browser and check /staff/health-cards again');

        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });
