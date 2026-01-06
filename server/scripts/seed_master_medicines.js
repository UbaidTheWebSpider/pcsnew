require('dotenv').config();
const mongoose = require('mongoose');
const MasterMedicine = require('../models/MasterMedicine');
const connectDB = require('../config/db');

// Sample medicine data
const sampleMedicines = [
    {
        name: 'Paracetamol',
        genericName: 'Acetaminophen',
        category: 'Analgesic',
        manufacturer: 'GSK',
        manufacturerCountry: 'Pakistan',
        strength: '500mg',
        dosageForm: 'tablet',
        packSize: '10 tablets',
        route: 'oral',
        unitPrice: 5,
        prescriptionRequired: false,
        drapApproved: true,
        drapSyncStatus: 'synced',
        description: 'Pain reliever and fever reducer'
    },
    {
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        category: 'Antibiotic',
        manufacturer: 'Abbott',
        manufacturerCountry: 'Pakistan',
        strength: '250mg',
        dosageForm: 'capsule',
        packSize: '20 capsules',
        route: 'oral',
        unitPrice: 15,
        prescriptionRequired: true,
        drapApproved: true,
        drapSyncStatus: 'synced',
        description: 'Penicillin antibiotic for bacterial infections'
    },
    {
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        category: 'Anti-inflammatory',
        manufacturer: 'Pfizer',
        manufacturerCountry: 'Pakistan',
        strength: '400mg',
        dosageForm: 'tablet',
        packSize: '10 tablets',
        route: 'oral',
        unitPrice: 8,
        prescriptionRequired: false,
        drapApproved: true,
        drapSyncStatus: 'synced',
        description: 'Nonsteroidal anti-inflammatory drug (NSAID)'
    },
    {
        name: 'Cetirizine',
        genericName: 'Cetirizine Hydrochloride',
        category: 'Antihistamine',
        manufacturer: 'Getz Pharma',
        manufacturerCountry: 'Pakistan',
        strength: '10mg',
        dosageForm: 'tablet',
        packSize: '10 tablets',
        route: 'oral',
        unitPrice: 6,
        prescriptionRequired: false,
        drapApproved: true,
        drapSyncStatus: 'synced',
        description: 'Antihistamine for allergies'
    },
    {
        name: 'Metformin',
        genericName: 'Metformin Hydrochloride',
        category: 'Endocrine',
        manufacturer: 'Novartis',
        manufacturerCountry: 'Pakistan',
        strength: '500mg',
        dosageForm: 'tablet',
        packSize: '30 tablets',
        route: 'oral',
        unitPrice: 12,
        prescriptionRequired: true,
        drapApproved: true,
        drapSyncStatus: 'synced',
        description: 'Oral diabetes medicine for type 2 diabetes'
    },
    {
        name: 'Omeprazole',
        genericName: 'Omeprazole',
        category: 'Gastrointestinal',
        manufacturer: 'Searle',
        manufacturerCountry: 'Pakistan',
        strength: '20mg',
        dosageForm: 'capsule',
        packSize: '14 capsules',
        route: 'oral',
        unitPrice: 18,
        prescriptionRequired: false,
        drapApproved: true,
        drapSyncStatus: 'synced',
        description: 'Proton pump inhibitor for acid reflux'
    },
    {
        name: 'Azithromycin',
        genericName: 'Azithromycin',
        category: 'Antibiotic',
        manufacturer: 'Pfizer',
        manufacturerCountry: 'Pakistan',
        strength: '500mg',
        dosageForm: 'tablet',
        packSize: '3 tablets',
        route: 'oral',
        unitPrice: 25,
        prescriptionRequired: true,
        drapApproved: true,
        drapSyncStatus: 'synced',
        description: 'Macrolide antibiotic for bacterial infections'
    },
    {
        name: 'Salbutamol Inhaler',
        genericName: 'Salbutamol',
        category: 'Respiratory',
        manufacturer: 'GSK',
        manufacturerCountry: 'Pakistan',
        strength: '100mcg',
        dosageForm: 'inhaler',
        packSize: '200 doses',
        route: 'inhalation',
        unitPrice: 350,
        prescriptionRequired: true,
        drapApproved: true,
        drapSyncStatus: 'synced',
        description: 'Bronchodilator for asthma and COPD'
    },
    {
        name: 'Atorvastatin',
        genericName: 'Atorvastatin Calcium',
        category: 'Cardiovascular',
        manufacturer: 'Abbott',
        manufacturerCountry: 'Pakistan',
        strength: '20mg',
        dosageForm: 'tablet',
        packSize: '30 tablets',
        route: 'oral',
        unitPrice: 22,
        prescriptionRequired: true,
        drapApproved: true,
        drapSyncStatus: 'synced',
        description: 'Statin for lowering cholesterol'
    },
    {
        name: 'Multivitamin Syrup',
        genericName: 'Multivitamin',
        category: 'Vitamin/Supplement',
        manufacturer: 'Martin Dow',
        manufacturerCountry: 'Pakistan',
        strength: '120ml',
        dosageForm: 'syrup',
        packSize: '120ml bottle',
        route: 'oral',
        unitPrice: 150,
        prescriptionRequired: false,
        drapApproved: true,
        drapSyncStatus: 'synced',
        description: 'Multivitamin supplement for general health'
    },
    {
        name: 'Diclofenac Gel',
        genericName: 'Diclofenac Sodium',
        category: 'Dermatological',
        manufacturer: 'Novartis',
        manufacturerCountry: 'Pakistan',
        strength: '1%',
        dosageForm: 'gel',
        packSize: '30g tube',
        route: 'topical',
        unitPrice: 180,
        prescriptionRequired: false,
        drapApproved: true,
        drapSyncStatus: 'synced',
        description: 'Topical NSAID for pain and inflammation'
    },
    {
        name: 'Ciprofloxacin Eye Drops',
        genericName: 'Ciprofloxacin',
        category: 'Ophthalmic',
        manufacturer: 'Allergan',
        manufacturerCountry: 'Pakistan',
        strength: '0.3%',
        dosageForm: 'drops',
        packSize: '5ml',
        route: 'ophthalmic',
        unitPrice: 95,
        prescriptionRequired: true,
        drapApproved: true,
        drapSyncStatus: 'synced',
        description: 'Antibiotic eye drops for bacterial eye infections'
    },
    {
        name: 'Losartan',
        genericName: 'Losartan Potassium',
        category: 'Cardiovascular',
        manufacturer: 'Merck',
        manufacturerCountry: 'Pakistan',
        strength: '50mg',
        dosageForm: 'tablet',
        packSize: '30 tablets',
        route: 'oral',
        unitPrice: 28,
        prescriptionRequired: true,
        drapApproved: true,
        drapSyncStatus: 'synced',
        description: 'Angiotensin II receptor blocker for hypertension'
    },
    {
        name: 'Insulin Glargine',
        genericName: 'Insulin Glargine',
        category: 'Endocrine',
        manufacturer: 'Sanofi',
        manufacturerCountry: 'Pakistan',
        strength: '100 units/ml',
        dosageForm: 'injection',
        packSize: '10ml vial',
        route: 'parenteral',
        unitPrice: 1200,
        prescriptionRequired: true,
        drapApproved: true,
        isControlledSubstance: false,
        drapSyncStatus: 'synced',
        description: 'Long-acting insulin for diabetes management'
    },
    {
        name: 'Tramadol',
        genericName: 'Tramadol Hydrochloride',
        category: 'Analgesic',
        manufacturer: 'Pfizer',
        manufacturerCountry: 'Pakistan',
        strength: '50mg',
        dosageForm: 'capsule',
        packSize: '10 capsules',
        route: 'oral',
        unitPrice: 35,
        prescriptionRequired: true,
        drapApproved: true,
        isControlledSubstance: true,
        controlledSubstanceSchedule: 'Schedule IV',
        drapSyncStatus: 'synced',
        description: 'Opioid pain medication for moderate to severe pain'
    }
];

// Function to seed medicines
const seedMedicines = async (count = 15) => {
    try {
        await connectDB();

        console.log('Clearing existing master medicines...');
        await MasterMedicine.deleteMany({});

        console.log(`Seeding ${Math.min(count, sampleMedicines.length)} master medicines...`);

        const medicinesToSeed = sampleMedicines.slice(0, count);
        const createdMedicines = await MasterMedicine.insertMany(medicinesToSeed);

        console.log(`✓ Successfully seeded ${createdMedicines.length} master medicines`);
        console.log('\nSample medicines:');
        createdMedicines.slice(0, 5).forEach(med => {
            console.log(`  - ${med.name} (${med.strength}) - ${med.manufacturer}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error seeding medicines:', error);
        process.exit(1);
    }
};

// Function to seed large dataset for performance testing
const seedLargeDataset = async (count = 1000) => {
    try {
        await connectDB();

        console.log('Clearing existing master medicines...');
        await MasterMedicine.deleteMany({});

        console.log(`Generating ${count} master medicines for performance testing...`);

        const manufacturers = ['GSK', 'Pfizer', 'Abbott', 'Novartis', 'Merck', 'Sanofi', 'Getz Pharma', 'Searle', 'Martin Dow', 'Allergan'];
        const categories = ['Analgesic', 'Antibiotic', 'Antiviral', 'Antihistamine', 'Cardiovascular', 'Gastrointestinal', 'Respiratory', 'Endocrine', 'Dermatological', 'Ophthalmic'];
        const dosageForms = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'gel', 'drops', 'inhaler'];
        const strengths = ['5mg', '10mg', '25mg', '50mg', '100mg', '250mg', '500mg', '1g'];

        const medicines = [];

        for (let i = 0; i < count; i++) {
            const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
            const category = categories[Math.floor(Math.random() * categories.length)];
            const dosageForm = dosageForms[Math.floor(Math.random() * dosageForms.length)];
            const strength = strengths[Math.floor(Math.random() * strengths.length)];

            medicines.push({
                name: `Medicine-${i + 1}`,
                genericName: `Generic-${i + 1}`,
                category,
                manufacturer,
                manufacturerCountry: 'Pakistan',
                strength,
                dosageForm,
                packSize: `${Math.floor(Math.random() * 50) + 10} units`,
                route: 'oral',
                unitPrice: Math.floor(Math.random() * 500) + 10,
                prescriptionRequired: Math.random() > 0.5,
                drapApproved: Math.random() > 0.2,
                drapSyncStatus: 'synced',
                description: `Test medicine ${i + 1} for performance testing`
            });
        }

        // Insert in batches for better performance
        const batchSize = 100;
        let inserted = 0;

        for (let i = 0; i < medicines.length; i += batchSize) {
            const batch = medicines.slice(i, i + batchSize);
            await MasterMedicine.insertMany(batch);
            inserted += batch.length;
            console.log(`Inserted ${inserted}/${count} medicines...`);
        }

        console.log(`✓ Successfully seeded ${count} master medicines for performance testing`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding large dataset:', error);
        process.exit(1);
    }
};

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const count = parseInt(args[1]) || 15;

if (command === 'large') {
    seedLargeDataset(count);
} else {
    seedMedicines(count);
}
