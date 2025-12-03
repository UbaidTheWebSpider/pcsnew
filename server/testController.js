// Test if controller loads
try {
    const controller = require('./controllers/patientController');
    console.log('Controller loaded successfully!');
    console.log('Exported functions:', Object.keys(controller));
    console.log('joinConsultation exists?', typeof controller.joinConsultation);
} catch (error) {
    console.error('ERROR loading controller:', error.message);
    console.error(error.stack);
}
