require('dotenv').config({ path: '../.env.local' });
const axios = require('axios');
const PharmacyUser = require('./models/PharmacyUser');
const mongoose = require('mongoose');

async function testPOSSearchAPI() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telemedicine_db';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get a pharmacy user to get their token
        const pharmacyUser = await PharmacyUser.findOne().populate('pharmacyId');
        if (!pharmacyUser) {
            console.log('❌ No pharmacy user found!');
            return;
        }

        console.log('=== PHARMACY USER ===');
        console.log(`Email: ${pharmacyUser.email}`);
        console.log(`Role: ${pharmacyUser.role}`);
        console.log(`PharmacyId: ${pharmacyUser.pharmacyId?._id}\n`);

        // We need to get a valid JWT token
        // For testing, we'll make a request to the login endpoint first
        const baseURL = process.env.CLIENT_URL || 'http://localhost:5000';

        console.log('=== TESTING API ENDPOINT ===');
        console.log('Note: You need to get a valid token from your browser session\n');
        console.log('Steps to test manually:');
        console.log('1. Open browser DevTools (F12)');
        console.log('2. Go to Network tab');
        console.log('3. Search for "paracetamol" in POS');
        console.log('4. Look for the request to: /api/pharmacy/inventory/batches?search=paracetamol');
        console.log('5. Check the Response to see what data is returned\n');

        console.log('Expected Request URL:');
        console.log(`  ${baseURL}/api/pharmacy/inventory/batches?search=paracetamol\n`);

        console.log('Response should contain:');
        console.log('  - success: true');
        console.log('  - data: array of batch objects');
        console.log('  - Each batch should have medicineId populated with medicine details\n');

        console.log('If response shows "success: false" or empty data array:');
        console.log('  1. Check server console for errors');
        console.log('  2. Verify the server was restarted');
        console.log('  3. Check that req.pharmacyId is set correctly in the middleware\n');

        console.log('=== CHECKING WHAT API SHOULD RETURN ===');
        const Medicine = require('./models/Medicine');
        const MedicineBatch = require('./models/MedicineBatch');

        const pharmacyId = pharmacyUser.pharmacyId._id;
        const search = 'paracetamol';

        // Simulate what the controller does
        const medicines = await Medicine.find({
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { genericName: { $regex: search, $options: 'i' } }
            ],
            pharmacyId: pharmacyId,
            isActive: true
        }).select('_id');

        console.log(`Found ${medicines.length} medicines matching "${search}":`);
        medicines.forEach(med => console.log(`  - ${med._id}`));

        if (medicines.length === 0) {
            console.log('\n❌ PROBLEM: No medicines found with the search term!');
            console.log('   The pharmacyId filter might be too restrictive\n');

            // Check without pharmacyId filter
            const medicinesWithoutFilter = await Medicine.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { genericName: { $regex: search, $options: 'i' } }
                ],
                isActive: true
            });
            console.log(`Found ${medicinesWithoutFilter.length} medicines WITHOUT pharmacyId filter`);

            if (medicinesWithoutFilter.length > 0) {
                console.log('Medicines pharmacyIds:');
                medicinesWithoutFilter.forEach(med => {
                    console.log(`  - ${med.name}: ${med.pharmacyId}`);
                });
                console.log(`\nExpected pharmacyId: ${pharmacyId}`);
            }
            return;
        }

        const medIds = medicines.map(m => m._id);

        const batches = await MedicineBatch.find({
            pharmacyId: pharmacyId,
            isDeleted: false,
            $or: [
                { medicineId: { $in: medIds } },
                { batchNumber: { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } }
            ]
        })
            .populate('medicineId', 'name genericName category form strength price taxRate manufacturer')
            .populate('supplierId', 'supplierName contactPerson')
            .sort({ expiryDate: 1 });

        console.log(`\nFound ${batches.length} batches\n`);

        if (batches.length === 0) {
            console.log('❌ PROBLEM: No batches found!');
            console.log('   Medicines exist but no batches match the criteria\n');
        } else {
            console.log('Batches that should be returned:');
            batches.forEach(batch => {
                console.log(`  - ${batch.medicineId?.name || 'Unknown'}`);
                console.log(`    Batch: ${batch.batchNumber}, Qty: ${batch.quantity}`);
                console.log(`    Price: ${batch.medicineId?.price}, Status: ${batch.status}\n`);
            });

            console.log('✅ API should return these batches when searching for "paracetamol"');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

testPOSSearchAPI();
