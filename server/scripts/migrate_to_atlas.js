const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Default local URI
const LOCAL_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telemedicine_db';
const ATLAS_URI = process.argv[2];

if (!ATLAS_URI) {
    console.error('❌ Please provide the Atlas Connection String as the first argument.');
    console.error('Usage: node migrate_to_atlas.js <ATLAS_CONNECTION_STRING>');
    process.exit(1);
}

const copyData = async () => {
    console.log('🚀 Starting Migration...');
    console.log(`📂 Source: ${LOCAL_URI}`);
    console.log(`☁️  Target: Atlas`); // Don't log full URI for security

    const localConnection = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Connected to Local DB');

    const atlasConnection = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✅ Connected to Atlas DB');

    try {
        // Get all collections from local
        const collections = await localConnection.db.listCollections().toArray();

        for (const collection of collections) {
            const modelName = collection.name;
            console.log(`\n📦 Migrating collection: ${modelName}...`);

            // Read from local
            const docs = await localConnection.db.collection(modelName).find({}).toArray();
            console.log(`   Found ${docs.length} documents locally.`);

            if (docs.length === 0) {
                console.log('   Skipping empty collection.');
                continue;
            }

            // Write to Atlas using bulkWrite for robust sync (replaceOne + upsert)
            const targetColl = atlasConnection.db.collection(modelName);

            try {
                if (docs.length > 0) {
                    const bulkOps = docs.map(doc => ({
                        replaceOne: {
                            filter: { _id: doc._id },
                            replacement: doc,
                            upsert: true
                        }
                    }));

                    const result = await targetColl.bulkWrite(bulkOps);
                    console.log(`   ✅ Synced ${docs.length} documents (Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}, Upserted: ${result.upsertedCount})`);
                }
            } catch (err) {
                console.error(`   ❌ Error migrating ${modelName}:`, err.message);
            }
        }

        console.log('\n✨ Migration Complete!');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await localConnection.close();
        await atlasConnection.close();
        process.exit(0);
    }
};

copyData();
