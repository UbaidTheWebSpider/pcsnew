require('dotenv').config({ path: '../.env.local' });
const mongoose = require('mongoose');
const Medicine = require('./models/Medicine');
const MedicineBatch = require('./models/MedicineBatch');
const PharmacyUser = require('./models/PharmacyUser');
const Pharmacy = require('./models/Pharmacy');

async function debugPOSSearch() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telemedicine_db';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Check Pharmacy Users
        console.log('=== PHARMACY USERS ===');
        const pharmacyUsers = await PharmacyUser.find().populate('pharmacyId');
        console.log(`Found ${pharmacyUsers.length} pharmacy users:`);
        pharmacyUsers.forEach(user => {
            console.log(`  - ${user.name} (${user.email})`);
            console.log(`    Role: ${user.role}`);
            console.log(`    PharmacyId: ${user.pharmacyId?._id || 'NOT SET'}`);
            console.log(`    Pharmacy Name: ${user.pharmacyId?.pharmacyName || 'N/A'}\n`);
        });

        if (pharmacyUsers.length === 0) {
            console.log('❌ NO PHARMACY USERS FOUND!\n');
            return;
        }

        const firstUser = pharmacyUsers[0];
        const pharmacyId = firstUser.pharmacyId?._id;

        if (!pharmacyId) {
            console.log('❌ Pharmacy user has no pharmacyId set!\n');
            return;
        }

        // 2. Check Medicines
        console.log('=== MEDICINES ===');
        const allMedicines = await Medicine.find();
        console.log(`Total medicines in database: ${allMedicines.length}`);

        const medicinesForThisPharmacy = await Medicine.find({ pharmacyId });
        console.log(`Medicines for pharmacyId ${pharmacyId}: ${medicinesForThisPharmacy.length}`);

        if (medicinesForThisPharmacy.length > 0) {
            console.log('\nSample medicines:');
            medicinesForThisPharmacy.slice(0, 5).forEach(med => {
                console.log(`  - ${med.name} (${med.genericName})`);
                console.log(`    PharmacyId: ${med.pharmacyId}`);
                console.log(`    Active: ${med.isActive}`);
                console.log(`    Batches: ${med.batches?.length || 0}\n`);
            });
        }

        // Search for "paracetamol"
        console.log('=== SEARCHING FOR "PARACETAMOL" ===');
        const paracetamolAll = await Medicine.find({
            $or: [
                { name: { $regex: 'paracetamol', $options: 'i' } },
                { genericName: { $regex: 'paracetamol', $options: 'i' } }
            ],
            isActive: true
        });
        console.log(`Found ${paracetamolAll.length} paracetamol medicines (all pharmacies)`);

        const paracetamolThisPharmacy = await Medicine.find({
            $or: [
                { name: { $regex: 'paracetamol', $options: 'i' } },
                { genericName: { $regex: 'paracetamol', $options: 'i' } }
            ],
            pharmacyId: pharmacyId,
            isActive: true
        });
        console.log(`Found ${paracetamolThisPharmacy.length} paracetamol medicines (this pharmacy: ${pharmacyId})`);

        if (paracetamolThisPharmacy.length > 0) {
            console.log('\nParacetamol medicines:');
            paracetamolThisPharmacy.forEach(med => {
                console.log(`  - ${med.name}`);
                console.log(`    ID: ${med._id}`);
                console.log(`    PharmacyId: ${med.pharmacyId}\n`);
            });
        }

        // 3. Check Medicine Batches
        console.log('=== MEDICINE BATCHES ===');
        const allBatches = await MedicineBatch.find().populate('medicineId');
        console.log(`Total batches in database: ${allBatches.length}`);

        const batchesForThisPharmacy = await MedicineBatch.find({
            pharmacyId,
            isDeleted: false
        }).populate('medicineId');
        console.log(`Batches for pharmacyId ${pharmacyId}: ${batchesForThisPharmacy.length}`);

        if (batchesForThisPharmacy.length > 0) {
            console.log('\nSample batches:');
            batchesForThisPharmacy.slice(0, 5).forEach(batch => {
                console.log(`  - ${batch.medicineId?.name || 'Unknown'}`);
                console.log(`    Batch: ${batch.batchNumber}`);
                console.log(`    Quantity: ${batch.quantity}`);
                console.log(`    PharmacyId: ${batch.pharmacyId}`);
                console.log(`    Status: ${batch.status}\n`);
            });
        }

        // Search for paracetamol batches
        if (paracetamolThisPharmacy.length > 0) {
            const medIds = paracetamolThisPharmacy.map(m => m._id);
            const paracetamolBatches = await MedicineBatch.find({
                pharmacyId: pharmacyId,
                medicineId: { $in: medIds },
                isDeleted: false
            }).populate('medicineId');

            console.log(`\nParacetamol batches for this pharmacy: ${paracetamolBatches.length}`);
            if (paracetamolBatches.length > 0) {
                console.log('Paracetamol batches:');
                paracetamolBatches.forEach(batch => {
                    console.log(`  - ${batch.medicineId?.name}`);
                    console.log(`    Batch: ${batch.batchNumber}`);
                    console.log(`    Qty: ${batch.quantity}`);
                    console.log(`    Status: ${batch.status}\n`);
                });
            }
        }

        // 4. Diagnosis
        console.log('\n=== DIAGNOSIS ===');
        if (medicinesForThisPharmacy.length === 0) {
            console.log('❌ PROBLEM: No medicines associated with this pharmacy!');
            console.log('   All Medicine records need pharmacyId set to:', pharmacyId);
        } else if (paracetamolThisPharmacy.length === 0) {
            console.log('❌ PROBLEM: No paracetamol medicine in this pharmacy!');
            console.log('   Need to add paracetamol to the pharmacy inventory');
        } else if (batchesForThisPharmacy.length === 0) {
            console.log('❌ PROBLEM: No batches exist for this pharmacy!');
            console.log('   Medicines exist but no batches (stock) available');
        } else {
            console.log('✅ Data looks correct. Issue may be:');
            console.log('   1. Server not restarted after code change');
            console.log('   2. User logged in with different pharmacy');
            console.log('   3. Frontend cache issue');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

debugPOSSearch();
