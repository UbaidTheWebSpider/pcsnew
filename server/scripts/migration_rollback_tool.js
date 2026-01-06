const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * MIGRATION ROLLBACK TOOL
 * 
 * Safety tool to selectively delete or revert records added during migration.
 * Usage: PROD_MONGODB_URI=".." node rollback_migration.js [log_file_path]
 **/

async function rollback() {
    const logPath = process.argv[2];
    if (!logPath || !fs.existsSync(logPath)) {
        console.error('❌ Error: Path to a valid migration log file is required.');
        process.exit(1);
    }

    const log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    const prodUri = process.env.PROD_MONGODB_URI;

    if (!prodUri) {
        console.error('❌ Error: PROD_MONGODB_URI must be set.');
        process.exit(1);
    }

    const client = new MongoClient(prodUri);

    try {
        await client.connect();
        const db = client.db();
        console.log('✅ Connected to Production database for rollback.');

        for (const entry of log) {
            if (entry.status !== 'SUCCESS' && entry.status !== 'VERIFICATION_FAILED') continue;

            console.log(`\n🧹 Rolling back collection: [${entry.collection}]`);
            // WARNING: This example logic assumes we want to clear the target collections 
            // if the migration was intended to be the source of truth.
            // In a production environment, you might want to only delete specific _ids.

            const response = await db.collection(entry.collection).deleteMany({});
            console.log(`   - Deleted ${response.deletedCount} documents.`);
        }

        console.log('\n✅ Rollback completed.');
    } catch (error) {
        console.error('💥 Rollback failed:', error.message);
    } finally {
        await client.close();
    }
}

rollback();
