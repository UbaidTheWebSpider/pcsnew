const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MedicineBatch = require('../models/MedicineBatch');
const CashierShift = require('../models/CashierShift');
const POSTransaction = require('../models/POSTransaction');
const PharmacyUser = require('../models/PharmacyUser');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const debugInvalidId = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Get Pharmacy User
        const pharmacyUser = await PharmacyUser.findOne({ status: 'active' });
        if (!pharmacyUser) throw new Error('No active pharmacy user');
        const pharmacyId = pharmacyUser.pharmacyId;
        const userId = pharmacyUser.userId;

        // 2. Ensure Open Shift
        let shift = await CashierShift.findOne({ cashierId: userId, status: 'open' });
        if (!shift) {
            shift = await CashierShift.create({
                cashierId: userId,
                pharmacyId,
                openingBalance: 1000,
                status: 'open'
            });
        }

        console.log('Testing with INVALID Batch ID...');

        // 3. Construct Payload with INVALID Batch ID
        const items = [{
            medicineId: new mongoose.Types.ObjectId(), // Valid but fake
            batchId: "INVALID-ID-STRING", // <--- THIS SHOULD CAUSE CAST ERROR
            quantity: 1,
            unitPrice: 100,
            discount: 0,
            medicineName: "Test Med"
        }];

        // Controller Logic Simulation
        // The controller does: const batch = await MedicineBatch.findById(item.batchId);

        try {
            console.log('Attempting MedicineBatch.findById("INVALID-ID-STRING")...');
            const batch = await MedicineBatch.findById("INVALID-ID-STRING");
            console.log('Batch find result:', batch);
        } catch (err) {
            console.log('Caught Expected Error:', err.name);
            console.log('Message:', err.message);
        }

        process.exit(0);
    } catch (error) {
        console.error('UNEXPECTED ERROR:', error);
        process.exit(1);
    }
};

debugInvalidId();
