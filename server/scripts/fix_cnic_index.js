const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const fixIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('patients');

        console.log('Checking for cnic_1 index...');
        const indexes = await collection.indexes();
        const hasCnicIndex = indexes.some(idx => idx.name === 'cnic_1');

        if (hasCnicIndex) {
            console.log('Dropping cnic_1 index...');
            await collection.dropIndex('cnic_1');
            console.log('Successfully dropped old index. Re-indexing will happen on next app start.');
        } else {
            console.log('No cnic_1 index found or already dropped.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error fixing index:', error);
        process.exit(1);
    }
};

fixIndex();
