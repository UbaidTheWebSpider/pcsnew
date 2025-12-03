// Test if routes file loads
try {
    const router = require('./routes/patientRoutes');
    console.log('Routes loaded successfully!');
    console.log('Router type:', typeof router);
    console.log('Router stack length:', router.stack?.length);

    // Print all routes
    if (router.stack) {
        router.stack.forEach((layer, index) => {
            if (layer.route) {
                const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
                console.log(`${index + 1}. ${methods} ${layer.route.path}`);
            }
        });
    }
} catch (error) {
    console.error('ERROR loading routes:', error.message);
    console.error(error.stack);
}
