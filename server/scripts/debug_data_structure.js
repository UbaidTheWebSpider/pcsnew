const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Medicine = require('../models/Medicine');
const MedicineBatch = require('../models/MedicineBatch');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkDataStructure = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const medicines = await Medicine.find({}).limit(3);

        console.log('--- Checking Medicines ---');
        medicines.forEach(med => {
            console.log(`Med: ${med.name} (${med._id})`);
            if (med.batches && med.batches.length > 0) {
                med.batches.forEach((b, i) => {
                    console.log(`  Batch[${i}]: _id=${b._id}, No=${b.batchNo}, Qty=${b.quantity}`);
                    if (!b._id) console.error('  !!! BATCH MISSING _ID !!!');
                });
            } else {
                console.log('  No batches');
            }
        });

        console.log('\n--- Checking Correlation ---');
        // Pick one batch ID if available and check if it exists in MedicineBatch
        if (medicines[0] && medicines[0].batches.length > 0) {
            const batchId = medicines[0].batches[0]._id;
            if (batchId) {
                const mb = await MedicineBatch.findById(batchId);
                console.log(`Checking Batch ID ${batchId} in MedicineBatch collection:`, mb ? 'FOUND' : 'NOT FOUND');
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkDataStructure();
