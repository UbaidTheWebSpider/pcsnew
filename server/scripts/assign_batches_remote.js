const mongoose = require('mongoose');
const MasterMedicine = require('../models/MasterMedicine');
const MasterMedicineBatch = require('../models/MasterMedicineBatch');
const Pharmacy = require('../models/Pharmacy');
const Supplier = require('../models/Supplier');
const User = require('../models/User');

// Connection String provided by user
const MONGO_URI = 'mongodb+srv://Vercel-Admin-telemedicine_db:RJQtw3IxQ2F3ekBI@telemedicine-db.xdkfugf.mongodb.net/?retryWrites=true&w=majority';

const generateBatchNumber = (index) => {
    const date = new Date().toISOString().slice(2, 7).replace('-', '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `B${date}-${random}-${index}`;
};

const assignBatches = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected!');

        // 1. Find Main Pharmacy
        console.log('Finding Active Pharmacy...');
        let pharmacy = await Pharmacy.findOne({ 'basicProfile.operationalStatus': 'Active' });
        if (!pharmacy) {
            console.log('No active pharmacy found, checking for any pharmacy...');
            pharmacy = await Pharmacy.findOne();
        }

        if (!pharmacy) {
            console.error('CRITICAL: No Pharmacy found in DB. Please register a pharmacy first.');
            process.exit(1);
        }
        console.log(`Using Pharmacy: ${pharmacy.basicProfile.pharmacyName} (${pharmacy._id})`);

        // 2. Find Supplier
        let supplier = await Supplier.findOne();
        if (!supplier) {
            console.log('No supplier found. Creating "Default Global Supplier"...');
            // Try to find a user for createdBy
            const admin = await User.findOne({ role: 'hospital_admin' }) || await User.findOne();
            if (!admin) throw new Error('No user found to create supplier');

            supplier = await Supplier.create({
                supplierCode: 'SUP-DEFAULT-001',
                supplierName: 'Global Meds Supply Co.',
                contactPerson: 'System Admin',
                email: 'supply@globalmeds.com',
                phone: '1234567890',
                address: '123 Warehouse St',
                status: 'Active',
                createdBy: admin._id
            });
            console.log('Created Default Supplier');
        }
        console.log(`Using Supplier: ${supplier.supplierName} (${supplier._id})`);

        // 3. Find System User (for createdBy)
        const systemUser = await User.findOne({ role: 'hospital_admin' }) || await User.findOne();
        if (!systemUser) {
            console.error('CRITICAL: No User found in DB.');
            process.exit(1);
        }
        console.log(`Using User (createdBy): ${systemUser.name}`);

        // 4. Get All Medicines
        const medicines = await MasterMedicine.find({ isActive: true });
        console.log(`Found ${medicines.length} active medicines.`);

        let createdCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < medicines.length; i++) {
            const med = medicines[i];

            // Check if batch exists for this med in this pharmacy
            const existingBatch = await MasterMedicineBatch.findOne({
                masterMedicineId: med._id,
                pharmacyId: pharmacy._id
            });

            if (existingBatch) {
                // Ensure it is available (User requirement: "make them available to sell")
                if (existingBatch.status !== 'available' && existingBatch.quantity > 0) {
                    existingBatch.status = 'available';
                    await existingBatch.save();
                    console.log(`Updated status to Available for: ${med.name}`);
                } else {
                    // console.log(`Skipping ${med.name} - Batch exists.`);
                    skippedCount++;
                }
                continue;
            }

            // Create New Batch
            const batchNum = generateBatchNumber(i);
            const mfgDate = new Date();
            mfgDate.setMonth(mfgDate.getMonth() - 2); // 2 months ago
            const expDate = new Date();
            expDate.setFullYear(expDate.getFullYear() + 2); // 2 years from now

            await MasterMedicineBatch.create({
                masterMedicineId: med._id,
                pharmacyId: pharmacy._id,
                batchNumber: batchNum,
                quantity: 100, // Stock up
                purchasePrice: med.price || 10,
                mrp: (med.price || 10) * 1.5, // 50% margin
                sellingPrice: (med.price || 10) * 1.4, // Slight discount
                supplierId: supplier._id,
                manufacturingDate: mfgDate,
                expiryDate: expDate,
                status: 'available',
                createdBy: systemUser._id,
                reorderLevel: 20
            });

            console.log(`[+] Assigned Batch ${batchNum} to ${med.name}`);
            createdCount++;
        }

        console.log('--- Summary ---');
        console.log(`Total Medicines: ${medicines.length}`);
        console.log(`New Batches Created: ${createdCount}`);
        console.log(`Existing Batches Skipped/Updated: ${skippedCount}`);

        process.exit(0);

    } catch (error) {
        console.error('Script Error:', error);
        process.exit(1);
    }
};

assignBatches();
