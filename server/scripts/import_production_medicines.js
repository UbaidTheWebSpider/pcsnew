require('dotenv').config({ path: '../.env.production' });
const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const MedicineBatch = require('../models/MedicineBatch');
const Pharmacy = require('../models/Pharmacy');
const PharmacyUser = require('../models/PharmacyUser');
const fs = require('fs');
const path = require('path');

async function importToProduction() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            console.error('❌ MONGODB_URI missing in .env.production');
            return;
        }

        console.log('Connecting to PRODUCTION database...');
        // Set stricter timeouts for production connection
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000 // 5s timeout
        });
        console.log('✅ Connected to Production MongoDB');

        // Load backup data
        const backupPath = path.join(__dirname, 'medicine_backup.json');
        if (!fs.existsSync(backupPath)) {
            console.error('❌ Backup file not found!');
            return;
        }

        const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        console.log(`Loaded ${data.medicines.length} medicines and ${data.batches.length} batches from backup`);

        // Need to map old IDs to new IDs to maintain relationships
        // But first, we need a valid Pharmacy ID in production
        const prodPharmacy = await Pharmacy.findOne();
        if (!prodPharmacy) {
            console.error('❌ No pharmacy found in production DB!');
            return;
        }

        const pharmacyId = prodPharmacy._id;
        console.log(`Using Production Pharmacy ID: ${pharmacyId}`);

        // Get a user for createdBy field
        const prodUser = await PharmacyUser.findOne({ pharmacyId });
        const userId = prodUser ? prodUser._id : null;

        console.log('Starting import...');

        const medicineMap = new Map(); // Old ID -> New ID

        // Import Medicines
        for (const med of data.medicines) {
            // Check if exists
            const existing = await Medicine.findOne({
                name: med.name,
                pharmacyId: pharmacyId
            });

            if (existing) {
                medicineMap.set(med._id, existing._id);
                console.log(`Skipped existing: ${med.name}`);
            } else {
                // Remove _id to create new
                const { _id, pharmacyId: oldPid, ...medData } = med;

                const newMed = await Medicine.create({
                    ...medData,
                    pharmacyId: pharmacyId, // Use production pharmacy ID
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                medicineMap.set(med._id, newMed._id);
                console.log(`Imported medicine: ${med.name}`);
            }
        }

        // Import Batches
        for (const batch of data.batches) {
            const newMedId = medicineMap.get(batch.medicineId);

            if (!newMedId) {
                console.warn(`⚠️ Skipped batch ${batch.batchNumber} - Medicine parent not found`);
                continue;
            }

            // Check if batch exists
            const existingBatch = await MedicineBatch.findOne({
                batchNumber: batch.batchNumber,
                pharmacyId: pharmacyId,
                medicineId: newMedId
            });

            if (existingBatch) {
                console.log(`Skipped existing batch: ${batch.batchNumber}`);
            } else {
                const { _id, medicineId, pharmacyId: oldPid, supplierId, createdBy, ...batchData } = batch;

                await MedicineBatch.create({
                    ...batchData,
                    medicineId: newMedId,
                    pharmacyId: pharmacyId,
                    supplierId: userId, // Fallback to current user if supplier mismatch
                    createdBy: userId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                console.log(`Imported batch: ${batch.batchNumber}`);
            }
        }

        console.log('\n✅ Import completed successfully!');

    } catch (error) {
        console.error('Import error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

importToProduction();
