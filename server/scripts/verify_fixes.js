require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Mock console.log to keep output clean, but we want to see errors
const originalLog = console.log;

async function verify() {
    console.log('--- Verifying Backend Fixes ---');

    try {
        // 1. Verify PrescriptionFulfillment Model
        const PrescriptionFulfillment = require('../models/PrescriptionFulfillment');

        // Check if validateFulfillment exists
        const pfSchema = PrescriptionFulfillment.schema;
        if (typeof pfSchema.methods.validateFulfillment === 'function') {
            console.log('✅ PASS: PrescriptionFulfillment.methods.validateFulfillment exists.');
        } else {
            console.error('❌ FAIL: PrescriptionFulfillment.methods.validateFulfillment is missing.');
            process.exit(1);
        }

        // Check if validate is Mongoose internal (or at least we didn't overwrite it with our custom logic)
        // Our custom logic had "this.status = 'in_progress'"
        // We can't easily inspect the function body of the internal validate, but we can check if it's NOT our function
        const validateFnStr = pfSchema.methods.validate ? pfSchema.methods.validate.toString() : '';
        if (!validateFnStr.includes("this.status = 'in_progress'")) {
            console.log('✅ PASS: PrescriptionFulfillment.methods.validate does not contain custom logic.');
        } else {
            console.error('❌ FAIL: PrescriptionFulfillment.methods.validate still contains custom logic.');
            process.exit(1);
        }

        // 2. Verify Patient Model
        const Patient = require('../models/Patient');
        // We can't easily verify the index removal without connecting to DB and checking indexes, 
        // but we can ensure the file loads without syntax errors.
        console.log('✅ PASS: Patient model loaded successfully.');

        // 3. Verify Controller Usage (Static Analysis via String Search)
        const fs = require('fs');
        const controllerPath = path.join(__dirname, '../controllers/pharmacyPrescriptionController.js');
        const controllerContent = fs.readFileSync(controllerPath, 'utf8');

        if (controllerContent.includes('.validateFulfillment(') && !controllerContent.includes('.validate(')) {
            console.log('✅ PASS: Controller uses .validateFulfillment() and no longer uses .validate().');
        } else if (controllerContent.includes('.validateFulfillment(')) {
            console.log('⚠️ WARNING: Controller uses .validateFulfillment() but ".validate(" was also found (might be false positive or internal usage).');
            // Check context of .validate(
            const lines = controllerContent.split('\n');
            lines.forEach((line, i) => {
                if (line.includes('.validate(')) {
                    console.log(`    Found .validate( at line ${i + 1}: ${line.trim()}`);
                }
            });
        } else {
            console.error('❌ FAIL: Controller does not appear to use .validateFulfillment().');
            process.exit(1);
        }

        console.log('--- Verification Complete ---');
        process.exit(0);

    } catch (error) {
        console.error('❌ FATAL ERROR During Verification:', error);
        process.exit(1);
    }
}

verify();
