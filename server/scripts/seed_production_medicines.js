require('dotenv').config({ path: '../.env.local' });
const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const MedicineBatch = require('../models/MedicineBatch');
const Pharmacy = require('../models/Pharmacy');
const PharmacyUser = require('../models/PharmacyUser');

async function seedProductionMedicines() {
    try {
        // Use local MongoDB with fallback
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telemedicine_db';
        console.log('Connecting to MongoDB...');

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find the first pharmacy
        const pharmacy = await Pharmacy.findOne();
        if (!pharmacy) {
            console.error('❌ No pharmacy found! Please create a pharmacy first.');
            return;
        }

        const pharmacyId = pharmacy._id;
        console.log(`Using Pharmacy: ${pharmacy.basicProfile?.pharmacyName || 'Unknown'}`);
        console.log(`Pharmacy ID: ${pharmacyId}\n`);

        // Find any pharmacy user (for createdBy field)
        const pharmacyUser = await PharmacyUser.findOne({ pharmacyId });
        if (!pharmacyUser) {
            console.error('❌ No pharmacy user found!');
            return;
        }

        const createdBy = pharmacyUser._id;

        // Sample medicines to add
        const sampleMedicines = [
            {
                name: 'Paracetamol 500mg',
                genericName: 'Paracetamol',
                manufacturer: 'GSK',
                category: 'Analgesic',
                strength: '500mg',
                form: 'Tablet',
                price: 2.50,
                taxRate: 0,
                reorderLevel: 50
            },
            {
                name: 'Amoxicillin 250mg',
                genericName: 'Amoxicillin',
                manufacturer: 'Abbott',
                category: 'Antibiotic',
                strength: '250mg',
                form: 'Capsule',
                price: 15.00,
                taxRate: 0,
                reorderLevel: 30
            },
            {
                name: 'Ibuprofen 400mg',
                genericName: 'Ibuprofen',
                manufacturer: 'Pfizer',
                category: 'NSAID',
                strength: '400mg',
                form: 'Tablet',
                price: 5.00,
                taxRate: 0,
                reorderLevel: 40
            },
            {
                name: 'Cetrizine 10mg',
                genericName: 'Cetirizine',
                manufacturer: 'Getz Pharma',
                category: 'Antihistamine',
                strength: '10mg',
                form: 'Tablet',
                price: 3.00,
                taxRate: 0,
                reorderLevel: 50
            },
            {
                name: 'Omeprazole 20mg',
                genericName: 'Omeprazole',
                manufacturer: 'Sanofi',
                category: 'PPI',
                strength: '20mg',
                form: 'Capsule',
                price: 8.00,
                taxRate: 0,
                reorderLevel: 30
            }
        ];

        console.log('=== ADDING MEDICINES ===\n');

        for (const medData of sampleMedicines) {
            // Check if medicine already exists
            const existing = await Medicine.findOne({
                name: medData.name,
                pharmacyId: pharmacyId
            });

            let medicine;
            if (existing) {
                console.log(`⚠️  Medicine "${medData.name}" already exists, skipping...`);
                medicine = existing;
            } else {
                medicine = await Medicine.create({
                    ...medData,
                    pharmacyId: pharmacyId,
                    isActive: true
                });
                console.log(`✅ Added medicine: ${medicine.name}`);
            }

            // Add a batch for this medicine
            const batchNumber = `B${Math.floor(Math.random() * 9000) + 1000}`;
            const existingBatch = await MedicineBatch.findOne({
                medicineId: medicine._id,
                pharmacyId: pharmacyId
            });

            if (existingBatch) {
                console.log(`   ⚠️  Batch already exists for "${medicine.name}", skipping batch...`);
            } else {
                // Create batch with future expiry date
                const now = new Date();
                const manufacturingDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                const expiryDate = new Date(now.getFullYear() + 2, now.getMonth(), 1);

                const batch = await MedicineBatch.create({
                    medicineId: medicine._id,
                    pharmacyId: pharmacyId,
                    batchNumber: batchNumber,
                    quantity: Math.floor(Math.random() * 200) + 100, // Random quantity 100-300
                    purchasePrice: medData.price * 0.6, // 60% of MRP
                    mrp: medData.price,
                    supplierId: pharmacyUser._id, // Using pharmacy user as placeholder
                    manufacturingDate: manufacturingDate,
                    expiryDate: expiryDate,
                    barcode: `BAR${Math.floor(Math.random() * 900000) + 100000}`,
                    isControlledDrug: false,
                    reorderLevel: medData.reorderLevel,
                    createdBy: createdBy,
                    status: 'available'
                });

                console.log(`   ✅ Added batch: ${batch.batchNumber} (Qty: ${batch.quantity})`);
            }
            console.log('');
        }

        console.log('\n=== SUMMARY ===');
        const totalMedicines = await Medicine.countDocuments({ pharmacyId });
        const totalBatches = await MedicineBatch.countDocuments({ pharmacyId, isDeleted: false });
        console.log(`Total Medicines: ${totalMedicines}`);
        console.log(`Total Batches: ${totalBatches}`);
        console.log('\n✅ Production database seeded successfully!');
        console.log('You can now search for these medicines in the POS interface.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

seedProductionMedicines();
