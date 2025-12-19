const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const listIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;

        const collections = ['patients', 'users'];

        for (const colName of collections) {
            console.log(`\n--- INDEXES FOR: ${colName} ---`);
            const indexes = await db.collection(colName).indexes();
            console.log(JSON.stringify(indexes, null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listIndexes();
