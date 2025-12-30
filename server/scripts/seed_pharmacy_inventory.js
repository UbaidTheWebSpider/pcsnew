const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Medicine = require('../models/Medicine');
const MedicineBatch = require('../models/MedicineBatch');
const PharmacyUser = require('../models/PharmacyUser');
const CashierShift = require('../models/CashierShift');
const POSTransaction = require('../models/POSTransaction');

// Load env vars
dotenv.config();

const seedInventory = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Get the pharmacy user we created/linked earlier
        // User: ph@mail.com (from previous seed) or phar01
        // We need the pharmacyId
        // Let's find any pharmacy user to get a valid pharmacyId
        const pharmacyUser = await PharmacyUser.findOne({ status: 'active' });

        if (!pharmacyUser) {
            console.error('No active pharmacy user found. Please run seed_pharmacy_user.js first.');
            process.exit(1);
        }

        const pharmacyId = pharmacyUser.pharmacyId;
        const userId = pharmacyUser.userId;
        console.log(`Seeding for Pharmacy ID: ${pharmacyId}`);

        // Clean existing data for this pharmacy
        await Medicine.deleteMany({ pharmacyId });
        await MedicineBatch.deleteMany({ pharmacyId });
        console.log('Cleared existing inventory for this pharmacy.');

        const medicinesData = [
            {
                name: 'Panadol Extra',
                genericName: 'Paracetamol + Caffeine',
                manufacturer: 'GSK',
                category: 'Analgesic',
                strength: '500mg/65mg',
                form: 'tablet',
                price: 15, // Sales price per unit
                reorderLevel: 100,
                barcode: '8964001234567'
            },
            {
                name: 'Augmentin',
                genericName: 'Amoxicillin + Clavulanic Acid',
                manufacturer: 'GSK',
                category: 'Antibiotic',
                strength: '625mg',
                form: 'tablet',
                price: 45,
                reorderLevel: 50,
                barcode: '8964001234568'
            },
            {
                name: 'Brufen',
                genericName: 'Ibuprofen',
                manufacturer: 'Abbott',
                category: 'Analgesic',
                strength: '400mg',
                form: 'tablet',
                price: 12,
                reorderLevel: 200,
                barcode: '8964001234569'
            },
            {
                name: 'Lantus SoloStar',
                genericName: 'Insulin Glargine',
                manufacturer: 'Sanofi',
                category: 'Insulin',
                strength: '100IU/ml',
                form: 'injection',
                price: 1500,
                reorderLevel: 10,
                barcode: '8964001234570'
            },
            {
                name: 'Rigix',
                genericName: 'Cetirizine',
                manufacturer: 'AGP',
                category: 'Antihistamine',
                strength: '10mg',
                form: 'tablet',
                price: 18,
                reorderLevel: 50,
                barcode: '8964001234571'
            },
            {
                name: 'Cran Max',
                genericName: 'Cranberry Extract',
                manufacturer: 'Hilton',
                category: 'Nutraceutical',
                strength: 'Sachet',
                form: 'powder',
                price: 85,
                reorderLevel: 30,
                barcode: '8964001234572'
            },
            {
                name: 'Ascard',
                genericName: 'Aspirin',
                manufacturer: 'Atco',
                category: 'Blood Thinner',
                strength: '75mg',
                form: 'tablet',
                price: 5,
                reorderLevel: 100,
                barcode: '8964001234573'
            },
            {
                name: 'Getryl',
                genericName: 'Glimepiride',
                manufacturer: 'Getz Pharma',
                category: 'Antidiabetic',
                strength: '2mg',
                form: 'tablet',
                price: 25,
                reorderLevel: 60,
                barcode: '8964001234574'
            }
        ];

        for (const medData of medicinesData) {
            // Create Medicine
            const medicine = await Medicine.create({
                ...medData,
                pharmacyId
            });

            // Create 1-2 Batches for each
            const numBatches = Math.floor(Math.random() * 2) + 1; // 1 or 2 batches
            const batches = [];

            for (let i = 0; i < numBatches; i++) {
                const isExpired = Math.random() < 0.1; // 10% chance
                const quantity = Math.floor(Math.random() * 200) + 20;

                let expiryDate = new Date();
                if (isExpired) {
                    expiryDate.setMonth(expiryDate.getMonth() - 2); // Expired 2 months ago
                } else {
                    expiryDate.setMonth(expiryDate.getMonth() + Math.floor(Math.random() * 24) + 6); // Expires in 6-30 months
                }

                const batch = await MedicineBatch.create({
                    medicineId: medicine._id,
                    pharmacyId,
                    batchNumber: `B${Math.floor(Math.random() * 10000)}`,
                    quantity,
                    purchasePrice: medData.price * 0.7, // 30% margin
                    mrp: medData.price,
                    expiryDate,
                    manufacturingDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
                    barcode: `${medData.barcode}${i}`, // Unique barcode per batch ideally, but simplified
                    supplierId: new mongoose.Types.ObjectId(), // Fake supplier ID
                    status: isExpired ? 'expired' : 'available',
                    createdBy: userId
                });

                batches.push({
                    batchNo: batch.batchNumber,
                    quantity: batch.quantity,
                    expDate: batch.expiryDate,
                    status: batch.status,
                    _id: batch._id // Store batch ID in Medicine array for legacy support
                });
            }

            // Look back update medicine with batches array (for legacy compatibility)
            medicine.batches = batches;
            await medicine.save();

            console.log(`Created ${medicine.name} with ${numBatches} batches.`);
        }

        // Create a dummy shift
        console.log('Creating sample shift and transactions...');
        const shift = await CashierShift.create({
            cashierId: userId,
            pharmacyId,
            shiftStart: new Date(new Date().setHours(8, 0, 0)),
            openingBalance: 1000,
            status: 'open'
        });

        // Create 3 sample transactions
        const sampleBatches = await MedicineBatch.find({ pharmacyId, status: 'available' })
            .populate('medicineId')
            .limit(3);
        let totalRevenue = 0;

        for (let i = 0; i < sampleBatches.length; i++) {
            const batch = sampleBatches[i];
            // Skip if medicineId is missing
            if (!batch.medicineId) continue;

            const qty = 2;
            const unitPrice = batch.mrp;
            const total = qty * unitPrice;

            await POSTransaction.create({
                pharmacyId,
                cashierId: userId,
                transactionId: `TRX-${Date.now()}-${i}`,
                items: [{
                    medicineId: batch.medicineId._id,
                    medicineName: batch.medicineId.name,
                    batchId: batch._id,
                    quantity: qty,
                    unitPrice: unitPrice,
                    discount: 0,
                    taxAmount: 0,
                    totalAmount: total
                }],
                paymentMethod: 'cash',
                subtotal: total,
                taxTotal: 0,
                discountTotal: 0,
                grandTotal: total,
                shiftId: shift._id,
                customerName: 'Walk-in Customer'
            });

            // Deduct stock (simplified, assuming sufficient)
            batch.quantity -= qty;
            if (batch.quantity <= 0) batch.status = 'sold_out';
            await batch.save();

            totalRevenue += total;
        }

        console.log(`Created 3 transactions. Revenue: ${totalRevenue}`);

        console.log('Seeding Completed Successfully');
        process.exit(0);

    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
};

seedInventory();
