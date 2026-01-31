require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
console.log('Testing connection to:', uri);

mongoose.connect(uri)
    .then(() => {
        console.log('✅ MongoDB Connection Successful!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Failed:', err);
        process.exit(1);
    });
