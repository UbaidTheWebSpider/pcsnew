const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Medicine = require('../models/Medicine');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const debugSearchFlow = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Simulate getMedicines
        const medicines = await Medicine.find({}).limit(1);
        const data = medicines; // simulating API response

        // Simulate ProductSearch.jsx logic
        const batches = [];
        data.forEach(med => {
            if (med.batches && med.batches.length > 0) {
                med.batches.forEach(batch => {
                    // Check if Mongoose object or plain JS
                    const batchObj = batch.toObject ? batch.toObject() : batch;

                    console.log('Processing Batch:', batchObj);

                    batches.push({
                        ...batchObj,
                        medicineId: med._id,
                        medicineName: med.name
                    });
                });
            }
        });

        console.log('Flattened Batches:');
        batches.forEach(b => {
            console.log(`Batch: ${b.batchNo}, _id: ${b._id} (${typeof b._id})`);
            if (!b._id) console.error('CRITICAL: MISSING _ID');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

debugSearchFlow();
