const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Medicine = require('../models/Medicine');
const MedicineBatch = require('../models/MedicineBatch');
const CashierShift = require('../models/CashierShift');
const POSTransaction = require('../models/POSTransaction');
const PharmacyUser = require('../models/PharmacyUser');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const debugTransaction = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Get Pharmacy User
        const pharmacyUser = await PharmacyUser.findOne({ status: 'active' });
        if (!pharmacyUser) throw new Error('No active pharmacy user');
        const pharmacyId = pharmacyUser.pharmacyId;
        const userId = pharmacyUser.userId;
        console.log(`User: ${userId}, Pharmacy: ${pharmacyId}`);

        // 2. Get Open Shift
        let shift = await CashierShift.findOne({ cashierId: userId, status: 'open' });
        if (!shift) {
            console.log('No open shift, looking for any open shift or creating one...');
            shift = await CashierShift.create({
                cashierId: userId,
                pharmacyId,
                openingBalance: 1000,
                status: 'open'
            });
            console.log('Created temp shift:', shift._id);
        } else {
            console.log('Found open shift:', shift._id);
        }

        // 3. Get a Batch
        const batch = await MedicineBatch.findOne({
            pharmacyId,
            status: 'available',
            quantity: { $gt: 0 }
        }).populate('medicineId');

        if (!batch) throw new Error('No available batch found');
        console.log(`Testing with Batch: ${batch.batchNumber}, Med: ${batch.medicineId.name}`);

        // 4. Simulate Transaction Data
        const item = {
            medicineId: batch.medicineId._id,
            batchId: batch._id,
            medicineName: batch.medicineId.name,
            batchNumber: batch.batchNumber,
            quantity: 1,
            unitPrice: batch.mrp || 100, // Handle missing MRP
            discount: 0,
            taxRate: 0,
            taxAmount: 0,
            totalAmount: batch.mrp || 100
        };

        // 5. Create Transaction
        console.log('Attempting to create transaction...');
        const transaction = await POSTransaction.create({
            pharmacyId,
            cashierId: userId,
            items: [item],
            paymentMethod: 'cash',
            paymentDetails: { cash: item.totalAmount },
            subtotal: item.totalAmount,
            taxTotal: 0,
            discountTotal: 0,
            grandTotal: item.totalAmount,
            shiftId: shift._id,
            customerName: 'Debug User'
        });

        console.log('Transaction created successfully:', transaction._id);
        console.log('Transaction ID:', transaction.transactionId);

        process.exit(0);
    } catch (error) {
        console.error('DEBUG ERROR:', error);
        // Log validation errors specifically
        if (error.name === 'ValidationError') {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation Error [${key}]:`, error.errors[key].message);
            });
        }
        process.exit(1);
    }
};

debugTransaction();
