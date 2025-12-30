const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Medicine = require('../models/Medicine');
const MedicineBatch = require('../models/MedicineBatch');
const CashierShift = require('../models/CashierShift');
const POSTransaction = require('../models/POSTransaction');
const PharmacyUser = require('../models/PharmacyUser');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const debugFrontendPayload = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Get Pharmacy User to mimic Cashier
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
            console.log('Created shift');
        }

        // 3. Get Batch
        const batch = await MedicineBatch.findOne({
            pharmacyId,
            status: 'available',
            quantity: { $gt: 0 }
        }).populate('medicineId');

        if (!batch) throw new Error('No batch found');

        // 4. Construct Payload EXACTLY like Frontend
        // Frontend does NOT send batchNumber
        const items = [{
            medicineId: batch.medicineId._id,
            batchId: batch._id,
            quantity: 1,
            unitPrice: batch.mrp || 100,
            discount: 0,
            medicineName: batch.medicineId.name
        }];

        const transactionData = {
            pharmacyId,
            cashierId: userId,
            shiftId: shift._id,
            items: items,
            paymentMethod: 'cash',
            paymentDetails: { cash: items[0].unitPrice },
            subtotal: items[0].unitPrice,
            taxTotal: 0,
            discountTotal: 0,
            grandTotal: items[0].unitPrice,
            customerName: 'Frontend Sim'
        };

        // 5. Create
        console.log('Creating transaction with frontend-like payload...');
        const transaction = await POSTransaction.create(transactionData);
        console.log('SUCCESS:', transaction.transactionId);

        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation Error [${key}]:`, error.errors[key].message);
            });
        }
        process.exit(1);
    }
};

debugFrontendPayload();
