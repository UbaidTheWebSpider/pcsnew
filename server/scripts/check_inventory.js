const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Medicine = require('../models/Medicine');
const MedicineBatch = require('../models/MedicineBatch');

const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
if (!process.env.MONGODB_URI) {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Check Inventory
        const medicines = await Medicine.find({ pharmacyId: '6942cdb3e5d07b87b3c50d20' }); // User's Pharmacy
        console.log(`\nFound ${medicines.length} medicines in Pharmacy01:`);

        let totalEmbedded = 0;
        medicines.forEach(m => {
            const batchCount = m.batches ? m.batches.length : 0;
            totalEmbedded += batchCount;
            console.log(`- ${m.name}: ${batchCount} batches embedded.`);
        });

        console.log(`\nTotal Embedded Batches across all medicines: ${totalEmbedded}`);

        const globalBatches = await MedicineBatch.countDocuments({ pharmacyId: '6942cdb3e5d07b87b3c50d20' });
        console.log(`Total Batches in Collection: ${globalBatches}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
