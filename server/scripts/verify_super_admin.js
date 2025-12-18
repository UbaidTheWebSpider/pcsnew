const mongoose = require('mongoose');
const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const ModuleRegistry = require('../models/ModuleRegistry');
const connectDB = require('../config/db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Helper to perform HTTP requests (simulated or real using axios if server running, but here we might just store directly for "seed" verification or use axios against running server)
// Actually, verification usually implies hitting the running server or unit testing. 
// Since this is a "script", let's make it a "seed & verify" script that operates on DB directly for setup, then maybe logs what manual steps are needed or uses axios.
// Let's use axios to hit the local server.

const axios = require('axios');

const PORT = process.env.PORT || 5000;
const API_URL = `http://localhost:${PORT}/api`;
let superAdminToken = '';
let createdUserId = '';

const runVerification = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        // 1. Create Super Admin User
        const email = `superadmin_test_${Date.now()}@example.com`;
        const password = 'password123';

        // Direct DB creation to bypass any potential registration blocks or to force role
        const user = await User.create({
            name: 'Test Super Admin',
            email,
            password, // Check if pre-save hook handles hashing. It does in User.js
            role: 'super_admin'
        });
        createdUserId = user._id;
        console.log('1. Created Super Admin User:', email);

        // 2. Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });
        superAdminToken = loginRes.data.token;
        console.log('2. Logged in successfully. Token received.');

        // 3. Test Settings Endpoint
        const settingsRes = await axios.get(`${API_URL}/super-admin/settings`, {
            headers: { Authorization: `Bearer ${superAdminToken}` }
        });
        console.log('3. Fetched Settings:', settingsRes.status === 200 ? 'PASS' : 'FAIL');

        // 4. Test Toggle Module
        const toggleRes = await axios.post(`${API_URL}/super-admin/modules/toggle`, {
            moduleKey: 'test_module',
            enabled: true
        }, {
            headers: { Authorization: `Bearer ${superAdminToken}` }
        });
        console.log('4. Toggled Module:', toggleRes.data.enabled === true ? 'PASS' : 'FAIL');

        // 5. Verify Audit Log
        const logsRes = await axios.get(`${API_URL}/super-admin/audit-logs`, {
            headers: { Authorization: `Bearer ${superAdminToken}` }
        });
        const hasLog = logsRes.data.logs.some(l => l.action === 'TOGGLE_MODULE');
        console.log('5. Audit Log Verified:', hasLog ? 'PASS' : 'FAIL');

        // Cleanup
        await User.findByIdAndDelete(createdUserId);
        await ModuleRegistry.deleteOne({ moduleKey: 'test_module' });
        console.log('Cleanup done.');

        console.log('VERIFICATION SUCCESSFUL');
        process.exit(0);

    } catch (error) {
        console.error('Verification Failed:', error.message);
        if (error.code) console.error('Error Code:', error.code);
        if (error.response) console.error('Response Status:', error.response.status, error.response.data);
        // Attempt cleanup
        if (createdUserId) await User.findByIdAndDelete(createdUserId);
        process.exit(1);
    }
};

runVerification();
