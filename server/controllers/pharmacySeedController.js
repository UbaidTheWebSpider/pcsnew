const Medicine = require('../models/Medicine');
const MedicineBatch = require('../models/MedicineBatch');
const Pharmacy = require('../models/Pharmacy');
const PharmacyUser = require('../models/PharmacyUser');

// @desc    Seed sample medicines (ADMIN ONLY - one-time use)
// @route   POST /api/pharmacy/seed-medicines
// @access  Private/Admin
exports.seedMedicines = async (req, res) => {
    try {
        // Find the first pharmacy
        const pharmacy = await Pharmacy.findOne();
        if (!pharmacy) {
            return res.status(404).json({
                success: false,
                message: 'No pharmacy found! Please create a pharmacy first.'
            });
        }

        const pharmacyId = pharmacy._id;

        // Find any pharmacy user (for createdBy field)
        const pharmacyUser = await PharmacyUser.findOne({ pharmacyId });
        if (!pharmacyUser) {
            return res.status(404).json({
                success: false,
                message: 'No pharmacy user found!'
            });
        }

        const createdBy = pharmacyUser._id;

        // Sample medicines to add
        const sampleMedicines = [
            {
                name: 'Paracetamol 500mg',
                genericName: 'Paracetamol',
                manufacturer: 'GSK',
                category: 'Analgesic',
                strength: '500mg',
                form: 'Tablet',
                price: 2.50,
                taxRate: 0,
                reorderLevel: 50
            },
            {
                name: 'Amoxicillin 250mg',
                genericName: 'Amoxicillin',
                manufacturer: 'Abbott',
                category: 'Antibiotic',
                strength: '250mg',
                form: 'Capsule',
                price: 15.00,
                taxRate: 0,
                reorderLevel: 30
            },
            {
                name: 'Ibuprofen 400mg',
                genericName: 'Ibuprofen',
                manufacturer: 'Pfizer',
                category: 'NSAID',
                strength: '400mg',
                form: 'Tablet',
                price: 5.00,
                taxRate: 0,
                reorderLevel: 40
            },
            {
                name: 'Cetrizine 10mg',
                genericName: 'Cetirizine',
                manufacturer: 'Getz Pharma',
                category: 'Antihistamine',
                strength: '10mg',
                form: 'Tablet',
                price: 3.00,
                taxRate: 0,
                reorderLevel: 50
            },
            {
                name: 'Omeprazole 20mg',
                genericName: 'Omeprazole',
                manufacturer: 'Sanofi',
                category: 'PPI',
                strength: '20mg',
                form: 'Capsule',
                price: 8.00,
                taxRate: 0,
                reorderLevel: 30
            }
        ];

        const results = [];

        for (const medData of sampleMedicines) {
            // Check if medicine already exists
            const existing = await Medicine.findOne({
                name: medData.name,
                pharmacyId: pharmacyId
            });

            let medicine;
            if (existing) {
                results.push({ name: medData.name, status: 'skipped - already exists' });
                medicine = existing;
            } else {
                medicine = await Medicine.create({
                    ...medData,
                    pharmacyId: pharmacyId,
                    isActive: true
                });
                results.push({ name: medicine.name, status: 'created' });
            }

            // Add a batch for this medicine
            const batchNumber = `B${Math.floor(Math.random() * 9000) + 1000}`;
            const existingBatch = await MedicineBatch.findOne({
                medicineId: medicine._id,
                pharmacyId: pharmacyId
            });

            if (!existingBatch) {
                const now = new Date();
                const manufacturingDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                const expiryDate = new Date(now.getFullYear() + 2, now.getMonth(), 1);

                await MedicineBatch.create({
                    medicineId: medicine._id,
                    pharmacyId: pharmacyId,
                    batchNumber: batchNumber,
                    quantity: Math.floor(Math.random() * 200) + 100,
                    purchasePrice: medData.price * 0.6,
                    mrp: medData.price,
                    supplierId: pharmacyUser._id,
                    manufacturingDate: manufacturingDate,
                    expiryDate: expiryDate,
                    barcode: `BAR${Math.floor(Math.random() * 900000) + 100000}`,
                    isControlledDrug: false,
                    reorderLevel: medData.reorderLevel,
                    createdBy: createdBy,
                    status: 'available'
                });
            }
        }

        const totalMedicines = await Medicine.countDocuments({ pharmacyId });
        const totalBatches = await MedicineBatch.countDocuments({ pharmacyId, isDeleted: false });

        res.json({
            success: true,
            message: 'Medicines seeded successfully',
            data: {
                results,
                totalMedicines,
                totalBatches
            }
        });
    } catch (error) {
        console.error('Seed medicines error:', error);
        res.status(500).json({
            success: false,
            message: 'Error seeding medicines',
            error: error.message
        });
    }
};
