const sql = require('mssql');

// Database configuration using environment variables
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        enableArithAbort: true,
        trustServerCertificate: false,
        connectionTimeout: 30000,
        requestTimeout: 30000,
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    }
};

// Global connection pool
let pool = null;

// Initialize connection pool
async function getPool() {
    if (!pool) {
        try {
            console.log('Initializing SQL connection pool...');
            pool = await sql.connect(dbConfig);
            console.log('✅ Connected to Azure SQL Database successfully');
        } catch (error) {
            console.error('❌ Failed to connect to Azure SQL Database:', error);
            throw error;
        }
    }
    return pool;
}

// CORS headers for all responses
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
};

// Enhanced error handling
function handleError(context, error) {
    context.log.error('Database operation failed:', {
        message: error.message,
        code: error.code,
        state: error.state,
        timestamp: new Date().toISOString()
    });
    
    const clientError = error.code === 'ETIMEOUT' ? 
        'Database connection timeout' :
        error.code === 'ELOGIN' ?
        'Database authentication failed' :
        'Database operation failed';
        
    context.res = {
        status: 500,
        headers: corsHeaders,
        body: { 
            error: clientError,
            timestamp: new Date().toISOString()
        }
    };
}

// Helper function for successful responses
function sendResponse(context, data, status = 200) {
    context.res = {
        status: status,
        headers: corsHeaders,
        body: data
    };
}

module.exports = {
    getPool,
    corsHeaders,
    handleError,
    sendResponse
};