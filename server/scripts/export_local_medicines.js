require('dotenv').config({ path: '../.env.local' });
const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const MedicineBatch = require('../models/MedicineBatch');
const Pharmacy = require('../models/Pharmacy');
const fs = require('fs');
const path = require('path');

async function exportLocalMedicines() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telemedicine_db';
        console.log('Connecting to LOCAL database...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to Local MongoDB');

        // Get medicines
        const medicines = await Medicine.find({ isActive: true });
        console.log(`Found ${medicines.length} medicines`);

        // Get batches
        const batches = await MedicineBatch.find({ isDeleted: false });
        console.log(`Found ${batches.length} batches`);

        const data = {
            medicines,
            batches
        };

        const outputPath = path.join(__dirname, 'medicine_backup.json');
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

        console.log(`✅ Data exported to ${outputPath}`);
    } catch (error) {
        console.error('Export error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Database disconnected');
    }
}

exportLocalMedicines();
