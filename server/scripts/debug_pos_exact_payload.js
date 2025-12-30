const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MedicineBatch = require('../models/MedicineBatch');
const CashierShift = require('../models/CashierShift');
const POSTransaction = require('../models/POSTransaction');
const PharmacyUser = require('../models/PharmacyUser');
const Medicine = require('../models/Medicine');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const debugExactPayload = async () => {
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

        // 3. Get Batch
        const batch = await MedicineBatch.findOne({
            pharmacyId,
            status: 'available',
            quantity: { $gt: 0 }
        }).populate('medicineId');

        if (!batch) throw new Error('No batch found');

        // 4. Construct Payload EXACTLY as POSInterface.jsx line 82
        // cartItems map structure
        const itemPayload = {
            medicineId: batch.medicineId._id.toString(),
            batchId: batch._id.toString(),
            quantity: 1,
            unitPrice: batch.mrp || 100, // item.price
            discount: 0,
            medicineName: batch.medicineId.name
        };

        const transactionPayload = {
            items: [itemPayload],
            paymentMethod: 'cash',
            paymentDetails: {
                cash: 100,
                card: 0,
                insurance: 0,
                wallet: 0
            },
            customerName: 'Walk-in Customer',
            customerPhone: '',
            customerCNIC: '' // Empty string as in frontend default
        };

        console.log('Payload:', JSON.stringify(transactionPayload, null, 2));

        // 5. Simulate Controller Logic (Manual Execution of what controller does)
        // Note: Controller adds pharmacyId, cashierId, shiftId, subtotal, etc.
        // But let's call the Model logic directly first to check validation.

        // Emulate what controller builds
        const finalDoc = {
            pharmacyId,
            cashierId: userId,
            shiftId: shift._id,
            items: [{
                medicineId: itemPayload.medicineId,
                batchId: itemPayload.batchId,
                medicineName: itemPayload.medicineName,
                quantity: itemPayload.quantity,
                unitPrice: itemPayload.unitPrice,
                discount: itemPayload.discount,
                taxRate: 0,
                taxAmount: 0,
                totalAmount: itemPayload.unitPrice // Calculated in controller
            }],
            paymentMethod: transactionPayload.paymentMethod,
            paymentDetails: transactionPayload.paymentDetails,
            subtotal: itemPayload.unitPrice,
            taxTotal: 0,
            discountTotal: 0,
            grandTotal: itemPayload.unitPrice,
            customerName: transactionPayload.customerName,
            customerPhone: transactionPayload.customerPhone,
            customerCNIC: transactionPayload.customerCNIC,
            notes: ''
        };

        console.log('Creating Document...');
        const transaction = await POSTransaction.create(finalDoc);
        console.log('SUCCESS:', transaction.transactionId);

        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation Error [${key}]:`, error.errors[key].message);
            });
        }
        process.exit(1);
    }
};

debugExactPayload();
