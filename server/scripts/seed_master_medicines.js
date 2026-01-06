require('dotenv').config();
const mongoose = require('mongoose');
const MasterMedicine = require('../models/MasterMedicine');
const connectDB = require('../config/db');

// Production-grade Pakistani pharmaceutical portfolio
const pakistaniMedicines = [
    // Atco Laboratories
    { name: 'Ascard', genericName: 'Aspirin', category: 'Analgesic', manufacturer: 'Atco Laboratories', strength: '75mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true, description: 'Blood thinner/Analgesic' },
    { name: 'Loprin', genericName: 'Aspirin', category: 'Analgesic', manufacturer: 'Atco Laboratories', strength: '75mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Cardnit', genericName: 'GTN', category: 'Cardiovascular', manufacturer: 'Atco Laboratories', strength: '2.6mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Atorva', genericName: 'Atorvastatin', category: 'Cardiovascular', manufacturer: 'Atco Laboratories', strength: '20mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Renitec', genericName: 'Enalapril', category: 'Cardiovascular', manufacturer: 'Atco Laboratories', strength: '10mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },

    // Getz Pharma
    { name: 'Zetro', genericName: 'Ceftriaxone', category: 'Antibiotic', manufacturer: 'Getz Pharma', strength: '1g', dosageForm: 'injection', route: 'parenteral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Risek', genericName: 'Omeprazole', category: 'Gastrointestinal', manufacturer: 'Getz Pharma', strength: '40mg', dosageForm: 'capsule', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Lipiget', genericName: 'Atorvastatin', category: 'Cardiovascular', manufacturer: 'Getz Pharma', strength: '20mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Novidat', genericName: 'Ciprofloxacin', category: 'Antibiotic', manufacturer: 'Getz Pharma', strength: '500mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Surbex-Z', genericName: 'Multivitamin', category: 'Vitamin/Supplement', manufacturer: 'Getz Pharma', strength: 'Standard', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },

    // GSK Pakistan
    { name: 'Panadol', genericName: 'Paracetamol', category: 'Analgesic', manufacturer: 'GSK Pakistan', strength: '500mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Augmentin', genericName: 'Amoxicillin + Clavulanate', category: 'Antibiotic', manufacturer: 'GSK Pakistan', strength: '625mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Calpol', genericName: 'Paracetamol', category: 'Analgesic', manufacturer: 'GSK Pakistan', strength: '120mg/5ml', dosageForm: 'syrup', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Zantac', genericName: 'Ranitidine', category: 'Gastrointestinal', manufacturer: 'GSK Pakistan', strength: '150mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true, isDiscontinued: true },
    { name: 'Ventolin', genericName: 'Salbutamol', category: 'Respiratory', manufacturer: 'GSK Pakistan', strength: '100mcg', dosageForm: 'inhaler', route: 'inhalation', drapSyncStatus: 'synced', drapApproved: true },

    // Abbott Pakistan
    { name: 'Brufen', genericName: 'Ibuprofen', category: 'Anti-inflammatory', manufacturer: 'Abbott Pakistan', strength: '400mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Cremaffin', genericName: 'Laxative', category: 'Gastrointestinal', manufacturer: 'Abbott Pakistan', strength: 'Standard', dosageForm: 'syrup', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Thyronorm', genericName: 'Levothyroxine', category: 'Endocrine', manufacturer: 'Abbott Pakistan', strength: '50mcg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Digene', genericName: 'Antacid', category: 'Gastrointestinal', manufacturer: 'Abbott Pakistan', strength: 'Standard', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Ensure', genericName: 'Nutritional Supplement', category: 'Vitamin/Supplement', manufacturer: 'Abbott Pakistan', strength: '400g', dosageForm: 'other', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },

    // The Searle Company
    { name: 'Hydryllin', genericName: 'Aminophylline Compound', category: 'Respiratory', manufacturer: 'The Searle Company', strength: 'Standard', dosageForm: 'syrup', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Gravinate', genericName: 'Dimenhydrinate', category: 'Gastrointestinal', manufacturer: 'The Searle Company', strength: '50mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Disprin', genericName: 'Aspirin', category: 'Analgesic', manufacturer: 'The Searle Company', strength: '300mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Fefol', genericName: 'Iron + Folic Acid', category: 'Vitamin/Supplement', manufacturer: 'The Searle Company', strength: 'Standard', dosageForm: 'capsule', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Nuberol', genericName: 'Paracetamol + Orphenadrine', category: 'Analgesic', manufacturer: 'The Searle Company', strength: 'Standard', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },

    // Highnoon Laboratories
    { name: 'Concor', genericName: 'Bisoprolol', category: 'Cardiovascular', manufacturer: 'Highnoon Laboratories', strength: '5mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Xplended', genericName: 'Metformin', category: 'Endocrine', manufacturer: 'Highnoon Laboratories', strength: '500mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Dayfine', genericName: 'Vitamin D', category: 'Vitamin/Supplement', manufacturer: 'Highnoon Laboratories', strength: '200,000 IU', dosageForm: 'capsule', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Lowplat', genericName: 'Clopidogrel', category: 'Cardiovascular', manufacturer: 'Highnoon Laboratories', strength: '75mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Myteka', genericName: 'Montelukast', category: 'Respiratory', manufacturer: 'Highnoon Laboratories', strength: '10mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },

    // Martin Dow
    { name: 'Glucophage', genericName: 'Metformin', category: 'Endocrine', manufacturer: 'Martin Dow', strength: '500mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Valtec', genericName: 'Valsartan', category: 'Cardiovascular', manufacturer: 'Martin Dow', strength: '80mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Arbitel', genericName: 'Telmisartan', category: 'Cardiovascular', manufacturer: 'Martin Dow', strength: '40mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Myogesic', genericName: 'Orphenadrine + Paracetamol', category: 'Analgesic', manufacturer: 'Martin Dow', strength: 'Standard', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Qalsan-D', genericName: 'Calcium + Vitamin D', category: 'Vitamin/Supplement', manufacturer: 'Martin Dow', strength: 'Standard', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },

    // Hilton Pharma
    { name: 'Insulin 30/70', genericName: 'Insulin', category: 'Endocrine', manufacturer: 'Hilton Pharma', strength: '100 IU/ml', dosageForm: 'injection', route: 'parenteral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Glucovance', genericName: 'Metformin + Glibenclamide', category: 'Endocrine', manufacturer: 'Hilton Pharma', strength: '500mg/5mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Neuromet', genericName: 'Vitamin B12', category: 'Neurological', manufacturer: 'Hilton Pharma', strength: '500mcg', dosageForm: 'injection', route: 'parenteral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Surbex-T', genericName: 'Multivitamin', category: 'Vitamin/Supplement', manufacturer: 'Hilton Pharma', strength: 'Standard', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Zyloric', genericName: 'Allopurinol', category: 'Other', manufacturer: 'Hilton Pharma', strength: '100mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },

    // AGP Limited
    { name: 'Rigix', genericName: 'Cetirizine', category: 'Antihistamine', manufacturer: 'AGP Limited', strength: '10mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Sinemet', genericName: 'Levodopa + Carbidopa', category: 'Neurological', manufacturer: 'AGP Limited', strength: '250mg/25mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Tramal', genericName: 'Tramadol', category: 'Analgesic', manufacturer: 'AGP Limited', strength: '50mg', dosageForm: 'capsule', route: 'oral', drapSyncStatus: 'synced', drapApproved: true, isControlledSubstance: true },
    { name: 'Angised', genericName: 'Isosorbide Dinitrate', category: 'Cardiovascular', manufacturer: 'AGP Limited', strength: '5mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Nuberol Forte', genericName: 'Paracetamol + Orphenadrine', category: 'Analgesic', manufacturer: 'AGP Limited', strength: 'Standard', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },

    // Sami Pharmaceuticals
    { name: 'Valsar', genericName: 'Valsartan', category: 'Cardiovascular', manufacturer: 'Sami Pharmaceuticals', strength: '80mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Atropine', genericName: 'Atropine Sulfate', category: 'Other', manufacturer: 'Sami Pharmaceuticals', strength: '1mg/ml', dosageForm: 'injection', route: 'parenteral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Ketress', genericName: 'Ketorolac', category: 'Analgesic', manufacturer: 'Sami Pharmaceuticals', strength: '30mg/ml', dosageForm: 'injection', route: 'parenteral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Fefan', genericName: 'Iron', category: 'Vitamin/Supplement', manufacturer: 'Sami Pharmaceuticals', strength: 'Standard', dosageForm: 'syrup', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Aminophylline', genericName: 'Aminophylline', category: 'Respiratory', manufacturer: 'Sami Pharmaceuticals', strength: '250mg/10ml', dosageForm: 'injection', route: 'parenteral', drapSyncStatus: 'synced', drapApproved: true },

    // Ferozsons Laboratories
    { name: 'Xavor', genericName: 'Rivaroxaban', category: 'Cardiovascular', manufacturer: 'Ferozsons Laboratories', strength: '10mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Sofomac', genericName: 'Sofosbuvir', category: 'Antiviral', manufacturer: 'Ferozsons Laboratories', strength: '400mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Qbal', genericName: 'Methylcobalamin', category: 'Neurological', manufacturer: 'Ferozsons Laboratories', strength: '500mcg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Neodipar', genericName: 'Heparin', category: 'Cardiovascular', manufacturer: 'Ferozsons Laboratories', strength: '5000 IU/ml', dosageForm: 'injection', route: 'parenteral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Amiglow', genericName: 'Nutritional Supplement', category: 'Vitamin/Supplement', manufacturer: 'Ferozsons Laboratories', strength: 'Standard', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },

    // Citi Pharma
    { name: 'Citi-Met', genericName: 'Metformin', category: 'Endocrine', manufacturer: 'Citi Pharma', strength: '500mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Citi-Ace', genericName: 'Lisinopril', category: 'Cardiovascular', manufacturer: 'Citi Pharma', strength: '5mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Citi-Cold', genericName: 'Cold & Flu Formula', category: 'Other', manufacturer: 'Citi Pharma', strength: 'Standard', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Citi-Pain', genericName: 'Paracetamol', category: 'Analgesic', manufacturer: 'Citi Pharma', strength: '500mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Citi-Cal', genericName: 'Calcium', category: 'Vitamin/Supplement', manufacturer: 'Citi Pharma', strength: '500mg', dosageForm: 'tablet', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },

    // Hamdard
    { name: 'Safi', genericName: 'Herbal Blood Purifier', category: 'Other', manufacturer: 'Hamdard', strength: 'Standard', dosageForm: 'syrup', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Roghan Badam Shirin', genericName: 'Almond Oil', category: 'Other', manufacturer: 'Hamdard', strength: 'Standard', dosageForm: 'solution', route: 'other', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Joshanda', genericName: 'Herbal Cold Remedy', category: 'Other', manufacturer: 'Hamdard', strength: 'Standard', dosageForm: 'powder', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Itrifal Ustukhuddus', genericName: 'Herbal Laxative', category: 'Other', manufacturer: 'Hamdard', strength: 'Standard', dosageForm: 'other', route: 'oral', drapSyncStatus: 'synced', drapApproved: true },
    { name: 'Arq Gulab', genericName: 'Rose Water', category: 'Other', manufacturer: 'Hamdard', strength: 'Standard', dosageForm: 'solution', route: 'other', drapSyncStatus: 'synced', drapApproved: true },
];

const seedMedicines = async () => {
    try {
        await connectDB();

        console.log('Clearing existing master medicines...');
        await MasterMedicine.deleteMany({});

        console.log(`Seeding ${pakistaniMedicines.length} National Master Medicines (Pakistan Standards)...`);

        const createdMedicines = await MasterMedicine.insertMany(pakistaniMedicines);

        console.log(`✓ Successfully seeded ${createdMedicines.length} master medicines!`);
        console.log('\nPreview (First 5):');
        createdMedicines.slice(0, 5).forEach(med => {
            console.log(`  - [${med.manufacturer}] ${med.name} (${med.strength}) - Generic: ${med.genericName}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error seeding medicines:', error);
        process.exit(1);
    }
};

seedMedicines();
