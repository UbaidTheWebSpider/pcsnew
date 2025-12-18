const mongoose = require('mongoose');
const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const ModuleRegistry = require('../models/ModuleRegistry');
const connectDB = require('../config/db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const runRollback = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        console.log('Starting Rollback / Disable Super Admin Features...');

        // 1. Disable all feature flags
        const updateRes = await SystemSetting.updateMany(
            { category: 'feature_flag' },
            { value: false }
        );
        console.log(`Disabled ${updateRes.modifiedCount} feature flags.`);

        // 2. Disable all modules
        const moduleRes = await ModuleRegistry.updateMany(
            {},
            { enabled: false }
        );
        console.log(`Disabled ${moduleRes.modifiedCount} modules.`);

        // 3. (Optional) Demote super admins
        // const demoRes = await User.updateMany({ role: 'super_admin' }, { role: 'admin' });
        // console.log(`Demoted ${demoRes.modifiedCount} super admins.`);

        console.log('ROLLBACK COMPLETE: System should be in safe state.');
        process.exit(0);

    } catch (error) {
        console.error('Rollback Failed:', error);
        process.exit(1);
    }
};

runRollback();
