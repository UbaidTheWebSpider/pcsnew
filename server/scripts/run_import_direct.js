const mongoose = require('mongoose');
const dotenv = require('dotenv');
// Adjust path to controller: We are in server/scripts, controller is in server/controllers
const { importMedicines } = require('../controllers/pharmacySeedController');
const PharmacyUser = require('../models/PharmacyUser');
const Pharmacy = require('../models/Pharmacy');
const User = require('../models/User');

// Load env (try local first, then production)
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
if (!process.env.MONGODB_URI) {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

// Mock Response Object
const mockRes = {
    status: (code) => ({
        json: (data) => console.log(`[Response ${code}]:`, JSON.stringify(data, null, 2))
    }),
    json: (data) => console.log('[Response 200]:', JSON.stringify(data, null, 2))
};

const run = async () => {
    try {
        console.log('Connecting to DB at:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Load Backup Data
        const backupData = require('./medicine_backup.json');

        // Find ALL Pharmacies to import into (brute force approach to ensure coverage)
        const pharmacies = await Pharmacy.find();
        console.log(`Found ${pharmacies.length} pharmacies.`);

        for (const p of pharmacies) {
            console.log(`\nImporting for Pharmacy: ${p.basicProfile?.pharmacyName} (${p._id})`);

            // Find a user linked to this pharmacy to impersonate
            const pu = await PharmacyUser.findOne({ pharmacyId: p._id }).populate('userId');

            let user;
            if (pu) {
                user = { _id: pu.userId._id, email: pu.userId.email || 'script-impersonated' };
                console.log(`Impersonating User: ${user.email} (${user._id})`);
            } else {
                console.log('No specific user found for this pharmacy. Using fallback context.');
                // Since our controller logic now DEPENDS on req.user or fallback to first pharmacy...
                // If we don't provide user, it might fallback to FIRST pharmacy again.
                // To force THIS pharmacy, we need to trick the controller?
                // Wait, controller logic Step 302:
                // 1. req.user -> find PharmacyUser -> gets pharmacyId.
                // 2. Fallback -> Pharmacy.findOne().

                // If no user linked, we CANNOT force specific pharmacy via current controller logic easily.
                // UNLESS we mock the PharmacyUser lookup? Impossible.

                // But in reality, every active pharmacy HAS a user.
                // If not, it's a dead pharmacy.
                console.log('Skipping import for pharmacy without user.');
                continue;
            }

            const req = {
                user: user,
                body: { ...backupData }
            };

            await importMedicines(req, mockRes);
        }

        console.log('\nAll imports attempted.');
        process.exit(0);
    } catch (err) {
        console.error('Script Error:', err);
        process.exit(1);
    }
};

run();
