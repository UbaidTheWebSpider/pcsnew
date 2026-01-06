const mongoose = require('mongoose');
const MasterMedicine = require('../models/MasterMedicine');
const MasterMedicineBatch = require('../models/MasterMedicineBatch');
const User = require('../models/User');
require('dotenv').config({ path: 'server/.env' });

const medicines = [
    { name: 'Risek', genericName: 'Omeprazole', manufacturer: 'Getz Pharma', category: 'Gastrointestinal', strength: '20mg', dosageForm: 'capsule', unitPrice: 15, packSize: '14s' },
    { name: 'Risek', genericName: 'Omeprazole', manufacturer: 'Getz Pharma', category: 'Gastrointestinal', strength: '40mg', dosageForm: 'capsule', unitPrice: 28, packSize: '14s' },
    { name: 'Panadol', genericName: 'Paracetamol', manufacturer: 'GSK Pakistan', category: 'Analgesic', strength: '500mg', dosageForm: 'tablet', unitPrice: 2.5, packSize: '200s' },
    { name: 'Panadol CF', genericName: 'Paracetamol + Pseudoephedrine', manufacturer: 'GSK Pakistan', category: 'Respiratory', strength: '500mg/30mg', dosageForm: 'tablet', unitPrice: 5, packSize: '100s' },
    { name: 'Augmentin', genericName: 'Amoxicillin + Clavulanic Acid', manufacturer: 'GSK Pakistan', category: 'Antibiotic', strength: '625mg', dosageForm: 'tablet', unitPrice: 45, packSize: '12s' },
    { name: 'Augmentin', genericName: 'Amoxicillin + Clavulanic Acid', manufacturer: 'GSK Pakistan', category: 'Antibiotic', strength: '1g', dosageForm: 'tablet', unitPrice: 85, packSize: '12s' },
    { name: 'Arinac', genericName: 'Ibuprofen + Pseudoephedrine', manufacturer: 'Abbott Pakistan', category: 'Respiratory', strength: '200mg/30mg', dosageForm: 'tablet', unitPrice: 6, packSize: '100s' },
    { name: 'Arinac Forte', genericName: 'Ibuprofen + Pseudoephedrine', manufacturer: 'Abbott Pakistan', category: 'Respiratory', strength: '400mg/60mg', dosageForm: 'tablet', unitPrice: 12, packSize: '50s' },
    { name: 'Brufen', genericName: 'Ibuprofen', manufacturer: 'Abbott Pakistan', category: 'Analgesic', strength: '400mg', dosageForm: 'tablet', unitPrice: 4, packSize: '30s' },
    { name: 'Brufen DS', genericName: 'Ibuprofen', manufacturer: 'Abbott Pakistan', category: 'Analgesic', strength: '200mg/5ml', dosageForm: 'syrup', unitPrice: 120, packSize: '120ml' },
    { name: 'Novidat', genericName: 'Ciprofloxacin', manufacturer: 'Sami Pharmaceuticals', category: 'Antibiotic', strength: '500mg', dosageForm: 'tablet', unitPrice: 35, packSize: '10s' },
    { name: 'Novidat', genericName: 'Ciprofloxacin', manufacturer: 'Sami Pharmaceuticals', category: 'Antibiotic', strength: '250mg', dosageForm: 'tablet', unitPrice: 20, packSize: '10s' },
    { name: 'Flagyl', genericName: 'Metronidazole', manufacturer: 'Abbott Pakistan', category: 'Antibiotic', strength: '400mg', dosageForm: 'tablet', unitPrice: 3, packSize: '200s' },
    { name: 'Flagyl', genericName: 'Metronidazole', manufacturer: 'Abbott Pakistan', category: 'Antibiotic', strength: '200mg/5ml', dosageForm: 'suspension', unitPrice: 95, packSize: '60ml' },
    { name: 'Voltral', genericName: 'Diclofenac Sodium', manufacturer: 'GSK Pakistan', category: 'Analgesic', strength: '50mg', dosageForm: 'tablet', unitPrice: 8, packSize: '20s' },
    { name: 'Voltral SR', genericName: 'Diclofenac Sodium', manufacturer: 'GSK Pakistan', category: 'Analgesic', strength: '100mg', dosageForm: 'tablet', unitPrice: 15, packSize: '20s' },
    { name: 'Cefspan', genericName: 'Cefixime', manufacturer: 'Sami Pharmaceuticals', category: 'Antibiotic', strength: '400mg', dosageForm: 'capsule', unitPrice: 160, packSize: '5s' },
    { name: 'Cefspan', genericName: 'Cefixime', manufacturer: 'Sami Pharmaceuticals', category: 'Antibiotic', strength: '100mg/5ml', dosageForm: 'suspension', unitPrice: 450, packSize: '30ml' },
    { name: 'Klaricid', genericName: 'Clarithromycin', manufacturer: 'Abbott Pakistan', category: 'Antibiotic', strength: '250mg', dosageForm: 'tablet', unitPrice: 65, packSize: '10s' },
    { name: 'Klaricid', genericName: 'Clarithromycin', manufacturer: 'Abbott Pakistan', category: 'Antibiotic', strength: '500mg', dosageForm: 'tablet', unitPrice: 120, packSize: '10s' },
    { name: 'Loprin', genericName: 'Aspirin', manufacturer: 'High-Q Pharmaceuticals', category: 'Cardiovascular', strength: '75mg', dosageForm: 'tablet', unitPrice: 1.5, packSize: '30s' },
    { name: 'Loprin', genericName: 'Aspirin', manufacturer: 'High-Q Pharmaceuticals', category: 'Cardiovascular', strength: '150mg', dosageForm: 'tablet', unitPrice: 2, packSize: '30s' },
    { name: 'Softin', genericName: 'Loratadine', manufacturer: 'Barrett Hodgson', category: 'Antihistamine', strength: '10mg', dosageForm: 'tablet', unitPrice: 12, packSize: '10s' },
    { name: 'Evion', genericName: 'Vitamin E', manufacturer: 'Merck (Pvt) Ltd', category: 'Vitamin/Supplement', strength: '400mg', dosageForm: 'capsule', unitPrice: 18, packSize: '30s' },
    { name: 'Evion', genericName: 'Vitamin E', manufacturer: 'Merck (Pvt) Ltd', category: 'Vitamin/Supplement', strength: '600mg', dosageForm: 'capsule', unitPrice: 25, packSize: '30s' },
    { name: 'Surbex-Z', genericName: 'Multivitamins + Zinc', manufacturer: 'Abbott Pakistan', category: 'Vitamin/Supplement', strength: 'Standard', dosageForm: 'tablet', unitPrice: 15, packSize: '30s' },
    { name: 'Hydryllin', genericName: 'Aminophylline + Diphenhydramine', manufacturer: 'Searle Company', category: 'Respiratory', strength: 'Standard', dosageForm: 'syrup', unitPrice: 110, packSize: '120ml' },
    { name: 'Hydryllin DM', genericName: 'Dextromethorphan + Diphenhydramine', manufacturer: 'Searle Company', category: 'Respiratory', strength: 'Standard', dosageForm: 'syrup', unitPrice: 125, packSize: '120ml' },
    { name: 'Extor', genericName: 'Amlodipine + Valsartan', manufacturer: 'Searle Company', category: 'Cardiovascular', strength: '5mg/80mg', dosageForm: 'tablet', unitPrice: 25, packSize: '14s' },
    { name: 'Extor', genericName: 'Amlodipine + Valsartan', manufacturer: 'Searle Company', category: 'Cardiovascular', strength: '10mg/160mg', dosageForm: 'tablet', unitPrice: 45, packSize: '14s' },
    { name: 'Exforge', genericName: 'Amlodipine + Valsartan', manufacturer: 'Novartis Pakistan', category: 'Cardiovascular', strength: '5mg/80mg', dosageForm: 'tablet', unitPrice: 65, packSize: '28s' },
    { name: 'Concor', genericName: 'Bisoprolol', manufacturer: 'Merck (Pvt) Ltd', category: 'Cardiovascular', strength: '5mg', dosageForm: 'tablet', unitPrice: 15, packSize: '14s' },
    { name: 'Concor', genericName: 'Bisoprolol', manufacturer: 'Merck (Pvt) Ltd', category: 'Cardiovascular', strength: '2.5mg', dosageForm: 'tablet', unitPrice: 10, packSize: '14s' },
    { name: 'Zestril', genericName: 'Lisinopril', manufacturer: 'AstraZeneca (Local Agency)', category: 'Cardiovascular', strength: '5mg', dosageForm: 'tablet', unitPrice: 20, packSize: '28s' },
    { name: 'Zestril', genericName: 'Lisinopril', manufacturer: 'AstraZeneca (Local Agency)', category: 'Cardiovascular', strength: '10mg', dosageForm: 'tablet', unitPrice: 35, packSize: '28s' },
    { name: 'Lipiget', genericName: 'Atorvastatin', manufacturer: 'Getz Pharma', category: 'Cardiovascular', strength: '10mg', dosageForm: 'tablet', unitPrice: 18, packSize: '10s' },
    { name: 'Lipiget', genericName: 'Atorvastatin', manufacturer: 'Getz Pharma', category: 'Cardiovascular', strength: '20mg', dosageForm: 'tablet', unitPrice: 32, packSize: '10s' },
    { name: 'Lipiget', genericName: 'Atorvastatin', manufacturer: 'Getz Pharma', category: 'Cardiovascular', strength: '40mg', dosageForm: 'tablet', unitPrice: 55, packSize: '10s' },
    { name: 'T-Day', genericName: 'Levocetirizine', manufacturer: 'Hilton Pharma', category: 'Antihistamine', strength: '5mg', dosageForm: 'tablet', unitPrice: 12, packSize: '10s' },
    { name: 'Fexet', genericName: 'Fexofenadine', manufacturer: 'Getz Pharma', category: 'Antihistamine', strength: '120mg', dosageForm: 'tablet', unitPrice: 18, packSize: '10s' },
    { name: 'Fexet', genericName: 'Fexofenadine', manufacturer: 'Getz Pharma', category: 'Antihistamine', strength: '180mg', dosageForm: 'tablet', unitPrice: 25, packSize: '10s' },
    { name: 'Gaviscon', genericName: 'Sodium Alginate + Bicarbonate', manufacturer: 'Reckitt Benckiser', category: 'Gastrointestinal', strength: 'Standard', dosageForm: 'suspension', unitPrice: 180, packSize: '150ml' },
    { name: 'Mucaine', genericName: 'Oxetacaine + Antacids', manufacturer: 'Pfizer Pakistan', category: 'Gastrointestinal', strength: 'Standard', dosageForm: 'suspension', unitPrice: 140, packSize: '120ml' },
    { name: 'Gravinate', genericName: 'Dimenhydrinate', manufacturer: 'Searle Company', category: 'Other', strength: '50mg', dosageForm: 'tablet', unitPrice: 2.5, packSize: '100s' },
    { name: 'Buscopan', genericName: 'Hyoscine Butylbromide', manufacturer: 'Sanofi Pakistan', category: 'Gastrointestinal', strength: '10mg', dosageForm: 'tablet', unitPrice: 6, packSize: '100s' },
    { name: 'Buscopan Plus', genericName: 'Hyoscine + Paracetamol', manufacturer: 'Sanofi Pakistan', category: 'Gastrointestinal', strength: '10mg/500mg', dosageForm: 'tablet', unitPrice: 12, packSize: '20s' },
    { name: 'Cebosh', genericName: 'Cefixime', manufacturer: 'Bosch Pharmaceuticals', category: 'Antibiotic', strength: '400mg', dosageForm: 'capsule', unitPrice: 155, packSize: '5s' },
    { name: 'Cebosh', genericName: 'Cefixime', manufacturer: 'Bosch Pharmaceuticals', category: 'Antibiotic', strength: '100mg/5ml', dosageForm: 'suspension', unitPrice: 420, packSize: '30ml' },
    { name: 'Monas', genericName: 'Montelukast', manufacturer: 'Sami Pharmaceuticals', category: 'Respiratory', strength: '10mg', dosageForm: 'tablet', unitPrice: 25, packSize: '14s' },
    { name: 'Monas', genericName: 'Montelukast', manufacturer: 'Sami Pharmaceuticals', category: 'Respiratory', strength: '5mg', dosageForm: 'tablet', unitPrice: 18, packSize: '14s' },
    { name: 'Avil', genericName: 'Pheniramine Maleate', manufacturer: 'Sanofi Pakistan', category: 'Antihistamine', strength: '25mg', dosageForm: 'tablet', unitPrice: 1.5, packSize: '250s' },
    { name: 'Avil', genericName: 'Pheniramine Maleate', manufacturer: 'Sanofi Pakistan', category: 'Antihistamine', strength: '50mg', dosageForm: 'tablet', unitPrice: 2.5, packSize: '100s' },
    { name: 'Xarith', genericName: 'Azithromycin', manufacturer: 'Hilton Pharma', category: 'Antibiotic', strength: '250mg', dosageForm: 'tablet', unitPrice: 60, packSize: '6s' },
    { name: 'Xarith', genericName: 'Azithromycin', manufacturer: 'Hilton Pharma', category: 'Antibiotic', strength: '500mg', dosageForm: 'tablet', unitPrice: 110, packSize: '3s' }
];

async function seed() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGODB_URI not found');

        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // 1. Seed MasterMedicines
        console.log('Seeding MasterMedicines...');
        const createdMedicines = [];
        for (const med of medicines) {
            const existing = await MasterMedicine.findOne({
                name: med.name,
                strength: med.strength,
                dosageForm: med.dosageForm,
                manufacturer: med.manufacturer
            });

            if (!existing) {
                const newMed = await MasterMedicine.create({
                    ...med,
                    drapRegistrationNumber: `DRAP-${Math.floor(Math.random() * 1000000)}`,
                    barcode: `786${Math.floor(Math.random() * 1000000000)}`,
                    drapApproved: true,
                    isActive: true
                });
                createdMedicines.push(newMed);
            } else {
                createdMedicines.push(existing);
            }
        }
        console.log(`Seeded ${createdMedicines.length} MasterMedicines`);

        // 2. Find a pharmacy to seed batches for
        // We'll look for the first user with 'pharmacy' role or 'pharmacy_admin'
        const pharmacyUser = await mongoose.model('User').findOne({ role: { $in: ['pharmacy', 'pharmacy_admin'] } });

        if (pharmacyUser) {
            const pharmacyId = pharmacyUser._id;
            console.log(`Found pharmacy user: ${pharmacyUser.name} (${pharmacyId}). Seeding batches...`);

            const batchPromises = createdMedicines.map(med => {
                return MasterMedicineBatch.create({
                    masterMedicineId: med._id,
                    pharmacyId: pharmacyId,
                    batchNumber: `BN-${Math.floor(Math.random() * 10000)}`,
                    quantity: 100 + Math.floor(Math.random() * 400),
                    purchasePrice: med.unitPrice * 0.8,
                    mrp: med.unitPrice,
                    manufacturingDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
                    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year later
                    barcode: med.barcode,
                    status: 'available',
                    supplierId: new mongoose.Types.ObjectId("60d0fe4f5311236168a109ca"), // Placeholder supplier
                    createdBy: pharmacyUser._id
                });
            });

            await Promise.all(batchPromises);
            console.log(`Seeded ${batchPromises.length} batches for pharmacy ${pharmacyUser.name}`);
        } else {
            console.log('No pharmacy user found. Skipping batch seeding.');
        }

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
