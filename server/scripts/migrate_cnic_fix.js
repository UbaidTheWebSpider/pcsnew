const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanupCnic = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const db = mongoose.connection.db;
        const collection = db.collection('patients');

        console.log('--- CLEANUP START ---');

        // 1. Identify all documents with null or empty string cnic
        const problematic = await collection.find({
            $or: [
                { cnic: null },
                { cnic: '' }
            ]
        }).toArray();

        console.log(`Found ${problematic.length} patients with null/empty CNIC.`);

        if (problematic.length > 0) {
            console.log('Unsetting cnic field for these documents...');
            const result = await collection.updateMany(
                {
                    $or: [
                        { cnic: null },
                        { cnic: '' }
                    ]
                },
                { $unset: { cnic: '' } }
            );
            console.log(`Updated ${result.modifiedCount} documents.`);
        }

        // 2. Drop existing index if it exists
        const indexes = await collection.indexes();
        const hasCnicIndex = indexes.some(idx => idx.name === 'cnic_1');

        if (hasCnicIndex) {
            console.log('Dropping existing cnic_1 index...');
            await collection.dropIndex('cnic_1');
        }

        // 3. Manually create the SPARSE UNIQUE index
        console.log('Creating sparse unique index for cnic...');
        await collection.createIndex(
            { cnic: 1 },
            { unique: true, sparse: true, name: 'cnic_1' }
        );
        console.log('Index created successfully.');

        console.log('--- CLEANUP COMPLETE ---');
        process.exit(0);
    } catch (error) {
        console.error('CRITICAL ERROR DURING CLEANUP:', error);
        process.exit(1);
    }
};

cleanupCnic();
