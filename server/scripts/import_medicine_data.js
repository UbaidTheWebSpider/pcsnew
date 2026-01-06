const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MasterMedicine = require('../models/MasterMedicine');
const MasterMedicineBatch = require('../models/MasterMedicineBatch');

async function importData() {
    try {
        const uri = process.env.PROD_MONGODB_URI; // Expecting this env var
        if (!uri) {
            console.error('Error: PROD_MONGODB_URI environment variable is not set.');
            console.log('Usage: PROD_MONGODB_URI="your_connection_string" node server/scripts/import_medicine_data.js');
            process.exit(1);
        }

        const dataPath = path.join(__dirname, '../export_medicine_data.json');
        if (!fs.existsSync(dataPath)) {
            throw new Error(`Export file not found at ${dataPath}. Run export_medicine_data.js first.`);
        }

        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        const { MasterMedicine: medicines, MasterMedicineBatch: batches } = data;

        console.log(`Loaded ${medicines.length} medicines and ${batches.length} batches from export.`);

        console.log('Connecting to Target MongoDB...');
        await mongoose.connect(uri);
        console.log('Connected.');

        // 1. Import MasterMedicines
        console.log('Syncing MasterMedicines...');
        const medIdMap = {}; // localId -> prodId

        for (const med of medicines) {
            const localId = med._id;
            delete med._id;
            delete med.__v;
            delete med.createdAt;
            delete med.updatedAt;

            // Upsert based on unique identifiers
            const updatedMed = await MasterMedicine.findOneAndUpdate(
                {
                    name: med.name,
                    manufacturer: med.manufacturer,
                    strength: med.strength,
                    dosageForm: med.dosageForm
                },
                med,
                { upsert: true, new: true, lean: true }
            );

            medIdMap[localId] = updatedMed._id;
        }
        console.log('MasterMedicines sync complete.');

        // 2. Import MasterMedicineBatches
        // NOTE: This preserves pharmacyId and createdBy from the local data.
        // If IDs differ in production, you may need to map them manually in a real scenario.
        console.log('Syncing MasterMedicineBatches...');
        let batchCount = 0;
        for (const batch of batches) {
            const localMedId = batch.masterMedicineId;
            const prodMedId = medIdMap[localMedId];

            if (!prodMedId) {
                console.warn(`Warning: Skipping batch ${batch.batchNumber} as medicine was not found/synced.`);
                continue;
            }

            delete batch._id;
            delete batch.__v;
            delete batch.createdAt;
            delete batch.updatedAt;
            batch.masterMedicineId = prodMedId;

            // Upsert based on pharmacy and batch number
            await MasterMedicineBatch.findOneAndUpdate(
                {
                    pharmacyId: batch.pharmacyId,
                    batchNumber: batch.batchNumber
                },
                batch,
                { upsert: true }
            );
            batchCount++;
        }
        console.log(`Successfully synced ${batchCount} batches.`);
        console.log('Global Import completed successfully.');

        process.exit(0);
    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
}

importData();
