const mongoose = require('mongoose');
const User = require('../models/User');
const PharmacyUser = require('../models/PharmacyUser');
const Pharmacy = require('../models/Pharmacy');
require('dotenv').config();

const seedPharmacyUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // 1. Find the user
        const userEmail = 'ph@mail.com';
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            console.error(`User ${userEmail} not found!`);
            process.exit(1);
        }
        console.log(`Found User: ${user.name} (${user._id})`);

        // 2. Find a pharmacy
        const pharmacy = await Pharmacy.findOne();
        if (!pharmacy) {
            // Create a dummy pharmacy if none exists
            console.log('No pharmacy found. Creating one...');
            const newPharmacy = await Pharmacy.create({
                basicProfile: {
                    pharmacyName: 'Central Hospital Pharmacy',
                    licenseNumber: 'L-123456',
                    pharmacyType: 'Hospital Pharmacy',
                    email: 'pharmacy@hospital.com',
                    phone: '1234567890'
                },
                status: 'approved'
            });
            console.log(`Created Pharmacy: ${newPharmacy.basicProfile.pharmacyName} (${newPharmacy._id})`);

            // Link user
            await linkUserToPharmacy(user, newPharmacy);
        } else {
            console.log(`Found Pharmacy: ${pharmacy.basicProfile.pharmacyName} (${pharmacy._id})`);
            await linkUserToPharmacy(user, pharmacy);
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

const linkUserToPharmacy = async (user, pharmacy) => {
    // Check if already linked
    let pharmacyUser = await PharmacyUser.findOne({ userId: user._id });
    if (pharmacyUser) {
        console.log('User already linked. Updating status...');
        pharmacyUser.status = 'active';
        pharmacyUser.pharmacyRole = 'pharmacy_admin';
        pharmacyUser.pharmacyId = pharmacy._id;
        await pharmacyUser.save();
    } else {
        console.log('Creating new link...');
        pharmacyUser = await PharmacyUser.create({
            userId: user._id,
            pharmacyId: pharmacy._id,
            pharmacyRole: 'pharmacy_admin', // Give full access
            status: 'active'
        });
    }
    console.log(`SUCCESS: Linked ${user.name} to ${pharmacy.basicProfile.pharmacyName} as ${pharmacyUser.pharmacyRole}`);
};

seedPharmacyUser();
