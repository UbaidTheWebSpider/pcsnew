// Script to drop and recreate the users collection to clear MongoDB schema cache
require('dotenv').config();
const mongoose = require('mongoose');

const clearMongoDBCache = async () => {
    try {
        // Connect to MongoDB
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/telemedicine');
        console.log('✅ MongoDB Connected');

        // Get the database
        const db = conn.connection.db;

        // Check if users collection exists
        const collections = await db.listCollections({ name: 'users' }).toArray();

        if (collections.length > 0) {
            console.log('📋 Users collection exists');

            // Get current validator
            const collectionInfo = await db.listCollections({ name: 'users' }).toArray();
            console.log('Current validator:', JSON.stringify(collectionInfo[0]?.options?.validator, null, 2));

            // Drop the collection validator
            try {
                await db.command({
                    collMod: 'users',
                    validator: {},
                    validationLevel: 'off'
                });
                console.log('✅ Removed collection validator');
            } catch (error) {
                console.log('⚠️  Could not remove validator:', error.message);
            }
        } else {
            console.log('📋 Users collection does not exist yet');
        }

        await mongoose.disconnect();
        console.log('✅ Done');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

clearMongoDBCache();
