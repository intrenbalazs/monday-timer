// Load environment variables from .env file
require('dotenv').config();

// Import the main application module
const { initApp } = require('./src/app');

// Initialize the application
initApp();
