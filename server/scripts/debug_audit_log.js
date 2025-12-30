const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PharmacyAuditLog = require('../models/PharmacyAuditLog');
const PharmacyUser = require('../models/PharmacyUser');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const debugAuditLog = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get Pharmacy User
        const pharmacyUser = await PharmacyUser.findOne({ status: 'active' });
        if (!pharmacyUser) throw new Error('No active pharmacy user');
        const pharmacyId = pharmacyUser.pharmacyId;
        const userId = pharmacyUser.userId;

        console.log('Attempting to create audit log...');
        await PharmacyAuditLog.createLog({
            pharmacyId,
            userId,
            userName: 'Debug',
            action: 'create',
            entity: 'transaction',
            entityId: new mongoose.Types.ObjectId(),
            description: 'Debug log test',
            metadata: { ipAddress: '127.0.0.1' }
        });

        console.log('Audit log created successfully');
        process.exit(0);
    } catch (error) {
        console.error('AUDIT LOG ERROR:', error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation Error [${key}]:`, error.errors[key].message);
            });
        }
        process.exit(1);
    }
};

debugAuditLog();
