const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MasterMedicine = require('../models/MasterMedicine');
const MasterMedicineBatch = require('../models/MasterMedicineBatch');

async function exportData() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGODB_URI not found');

        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('Connected.');

        console.log('Fetching MasterMedicines...');
        const masterMedicines = await MasterMedicine.find({}).lean();
        console.log(`Found ${masterMedicines.length} medicines.`);

        console.log('Fetching MasterMedicineBatches...');
        const batches = await MasterMedicineBatch.find({}).lean();
        console.log(`Found ${batches.length} batches.`);

        const data = {
            MasterMedicine: masterMedicines,
            MasterMedicineBatch: batches
        };

        const exportPath = path.join(__dirname, '../export_medicine_data.json');
        fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
        console.log(`Data exported successfully to ${exportPath}`);

        process.exit(0);
    } catch (error) {
        console.error('Export failed:', error);
        process.exit(1);
    }
}

exportData();
