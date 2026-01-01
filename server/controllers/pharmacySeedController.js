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

// @desc    Import medicines from backup (ADMIN ONLY)
// @route   POST /api/pharmacy/import-medicines
// @access  Private/Admin
exports.importMedicines = async (req, res) => {
    try {
        const { medicines, batches } = req.body;

        if (!medicines || !Array.isArray(medicines)) {
            return res.status(400).json({ success: false, message: 'Invalid medicines data' });
        }

        console.log(`[Import] Request received from user: ${req.user ? req.user.email : 'Unknown'}`);

        // Resolve Pharmacy Logic
        let pharmacyId = null;
        let pharmacyName = null;

        // 1. Try to get pharmacy from logged-in user context
        if (req.user) {
            try {
                const pharmacyUser = await PharmacyUser.findOne({ userId: req.user._id });
                if (pharmacyUser) {
                    pharmacyId = pharmacyUser.pharmacyId;

                    // Optional: Get name for logging
                    const p = await Pharmacy.findById(pharmacyId);
                    if (p) pharmacyName = p.basicProfile?.pharmacyName;

                    console.log(`[Import] Resolved pharmacy for user: ${pharmacyId} (${pharmacyName})`);
                }
            } catch (err) {
                console.error('[Import] Error finding pharmacy user:', err);
            }
        }

        // 2. Fallback: First available pharmacy (Legacy behavior, kept for safety but logged)
        if (!pharmacyId) {
            console.warn('[Import] No pharmacy linked to user. Falling back to first available pharmacy.');
            const pharmacy = await Pharmacy.findOne();
            if (pharmacy) {
                pharmacyId = pharmacy._id;
                pharmacyName = pharmacy.basicProfile?.pharmacyName;
            }
        }

        if (!pharmacyId) {
            return res.status(404).json({ success: false, message: 'No pharmacy found to import data into.' });
        }

        // Find user for createdBy (re-verify)
        const userLink = await PharmacyUser.findOne({ pharmacyId });
        const userId = userLink ? userLink._id : (req.user ? req.user._id : null);
        // Note: userId here should ref a User or PharmacyUser? 
        // Schema usually expects keys. Let's use whatever we have.

        const medicineMap = new Map(); // Old ID -> New ID
        const importResults = {
            targetPharmacy: pharmacyName,
            medicines: { created: 0, skipped: 0 },
            batches: { created: 0, skipped: 0 }
        };

        // Import Medicines
        for (const med of medicines) {
            const existing = await Medicine.findOne({
                name: med.name,
                pharmacyId: pharmacyId
            });

            if (existing) {
                medicineMap.set(med._id, existing._id);
                importResults.medicines.skipped++;
            } else {
                const { _id, pharmacyId: oldPid, ...medData } = med;
                const newMed = await Medicine.create({
                    ...medData,
                    pharmacyId: pharmacyId,
                    isActive: true,
                    updatedAt: new Date()
                });
                medicineMap.set(med._id, newMed._id);
                importResults.medicines.created++;
            }
        }

        // Import Batches
        if (batches && Array.isArray(batches)) {
            for (const batch of batches) {
                const newMedId = medicineMap.get(batch.medicineId);

                if (!newMedId) continue;

                // Sync Logic: Ensure batch exists in BOTH MedicineBatch collection AND Medicine.batches array

                // 1. Handle MedicineBatch Collection
                const existingBatchDocs = await MedicineBatch.find({
                    batchNumber: batch.batchNumber, // Payload uses batchNumber
                    pharmacyId: pharmacyId,
                    medicineId: newMedId
                });

                let batchCreated = false;

                if (existingBatchDocs.length > 0) {
                    importResults.batches.skipped++;
                } else {
                    const { _id, medicineId, pharmacyId: oldPid, supplierId, createdBy, ...batchData } = batch;

                    await MedicineBatch.create({
                        ...batchData,
                        medicineId: newMedId,
                        pharmacyId: pharmacyId,
                        supplierId: userId,
                        createdBy: userId, // Assuming createdBy requires OID
                        status: 'available',
                        updatedAt: new Date()
                    });
                    importResults.batches.created++;
                    batchCreated = true;
                }

                // 2. Handle Embedded Batches Array in Medicine Document
                const medDoc = await Medicine.findById(newMedId);
                if (medDoc) {
                    const batchExistsEmbedded = medDoc.batches && medDoc.batches.some(b => b.batchNo === batch.batchNumber);

                    if (!batchExistsEmbedded) {
                        // Map fields from payload to embedded schema
                        const newEmbeddedBatch = {
                            batchNo: batch.batchNumber,
                            quantity: batch.quantity,
                            mfgDate: batch.manufacturingDate,
                            expDate: batch.expiryDate,
                            supplierCost: batch.purchasePrice, // Map purchasePrice to supplierCost
                            status: 'available'
                        };

                        await Medicine.findByIdAndUpdate(newMedId, {
                            $push: { batches: newEmbeddedBatch }
                        });
                        // Implicitly updated via push
                    }
                }
            }
        }

        res.json({
            success: true,
            message: 'Import completed',
            data: importResults
        });

    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({
            success: false,
            message: 'Import failed',
            error: error.message
        });
    }
};
