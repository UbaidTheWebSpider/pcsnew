const mongoose = require('mongoose');
const User = require('../models/User');
const PharmacyUser = require('../models/PharmacyUser');
const Pharmacy = require('../models/Pharmacy');
require('dotenv').config();

const fixPharmacyAssociations = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI is not defined in environment variables');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // 1. Ensure at least one Pharmacy exists
        console.log('\n--- Checking Pharmacy ---');
        let pharmacy = await Pharmacy.findOne();
        if (!pharmacy) {
            console.log('No pharmacy found. Creating default valid pharmacy...');
            const adminUser = await User.findOne({ role: 'hospital_admin' });
            pharmacy = await Pharmacy.create({
                basicProfile: {
                    pharmacyName: 'Central Hospital Pharmacy',
                    pharmacyType: 'OPD Pharmacy',
                    hospitalBranch: 'Main',
                    pharmacyCode: 'PHA-CENTRAL-001',
                    operationalStatus: 'Active'
                },
                licensing: {
                    licenseNumber: 'LIC-CENTRAL-001',
                    licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 10))
                },
                assignedPharmacist: {
                    chiefPharmacist: adminUser?._id || (await User.findOne())?._id,
                    registrationNumber: 'REG-CENTRAL-001'
                },
                physicalLocation: {
                    floor: 'Ground',
                    wing: 'A'
                },
                approvalWorkflow: {
                    registeredBy: adminUser?._id || (await User.findOne())?._id,
                    approvalStatus: 'Approved'
                }
            });
            console.log(`Created Pharmacy: ${pharmacy.basicProfile.pharmacyName} (${pharmacy._id})`);
        } else {
            console.log(`Using existing Pharmacy: ${pharmacy.basicProfile.pharmacyName} (${pharmacy._id})`);
        }

        // 2. Find all users who SHOULD be pharmacy users
        // Target: users with relevant global roles
        console.log('\n--- Checking Eligible Users ---');
        const pharmacyUsers = await User.find({
            role: { $in: ['pharmacy', 'hospital_admin', 'hospital_staff', 'pharmacist', 'super_admin'] }
        });
        console.log(`Found ${pharmacyUsers.length} potential pharmacy users.`);

        if (pharmacyUsers.length === 0) {
            console.log('No users with "pharmacy" role found. Please create a user first.');
        }

        let fixedCount = 0;

        for (const user of pharmacyUsers) {
            console.log(`\nProcessing User: ${user.name} (${user.email})`);

            // Check if association exists
            let association = await PharmacyUser.findOne({ userId: user._id });

            if (!association) {
                console.log('  ❌ No association found. Creating one...');
                association = await PharmacyUser.create({
                    userId: user._id,
                    pharmacyId: pharmacy._id,
                    pharmacyRole: 'pharmacy_admin', // Default to admin for "pharmacy" role users
                    status: 'active',
                    permissions: ['all']
                });
                console.log('  ✅ Association created successfully.');
                fixedCount++;
            } else {
                console.log(`  ℹ️ Association exists (Status: ${association.status}, Role: ${association.pharmacyRole})`);

                let needsSave = false;

                // Fix inactive status
                if (association.status !== 'active') {
                    console.log('  ⚠️ Status is not active. Activating...');
                    association.status = 'active';
                    needsSave = true;
                }

                // Fix deleted status
                if (association.isDeleted) {
                    console.log('  ⚠️ Record is marked deleted. Restoring...');
                    association.isDeleted = false;
                    needsSave = true;
                }

                if (needsSave) {
                    await association.save();
                    console.log('  ✅ Association updated successfully.');
                    fixedCount++;
                } else {
                    console.log('  ✅ Association is already valid.');
                }
            }
        }

        console.log(`\n--- Summary ---`);
        console.log(`Total Checked: ${pharmacyUsers.length}`);
        console.log(`Total Fixed: ${fixedCount}`);
        console.log(`\nDone! You can now login without "No active pharmacy association" errors.`);

        mongoose.disconnect();
    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
};

fixPharmacyAssociations();
