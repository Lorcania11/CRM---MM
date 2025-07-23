
                //const sql = require('mssql');

                // Database configuration using environment variables
                //const dbConfig = {
                    //user: process.env.DB_USER,
                    //password: process.env.DB_PASSWORD,
                    //server: process.env.DB_SERVER,
                    //database: process.env.DB_NAME,
                    //options: {
                        //encrypt: true,
                        //enableArithAbort: true,
                        //trustServerCertificate: false,
                        //connectionTimeout: 30000,
                        //requestTimeout: 30000,
                        //pool: {
                            //max: 10,
                            //min: 0,
                            //idleTimeoutMillis: 30000
                        //}
                    //}
                //};

                // Global connection pool
                //let pool = null;

                // Initialize connection pool
                //async function getPool() {
                    //if (!pool) {
                        //try {
                            //console.log('Initializing SQL connection pool...');
                            //pool = await sql.connect(dbConfig);
                            //console.log('✅ Connected to Azure SQL Database successfully');
                        //} catch (error) {
                            //console.error('❌ Failed to connect to Azure SQL Database:', error);
                            //throw error;
                        //}
                    //}
                    //return pool;
                //}

                // CORS headers for all responses
                ///const corsHeaders = {
                    //'Access-Control-Allow-Origin': '*',
                    //'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    //'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
                //};

                // Enhanced error handling
                //function handleError(context, error) {
                    //context.log.error('Database operation failed:', {
                        //message: error.message,
                        //code: error.code,
                        //state: error.state,
                        //timestamp: new Date().toISOString()
                    //});
                    
                    //const clientError = error.code === 'ETIMEOUT' ? 
                        //'Database connection timeout' :
                        //error.code === 'ELOGIN' ?
                        //'Database authentication failed' :
                        //'Database operation failed';
                        
                    //context.res = {
                        //status: 500,
                        //headers: corsHeaders,
                        //body: { 
                            //error: clientError,
                            //timestamp: new Date().toISOString()
                        //}
                    //};
                //}

                // Helper function for successful responses
                //function sendResponse(context, data, status = 200) {
                    //context.res = {
                        //status: status,
                        //headers: corsHeaders,
                        //body: data
                    //};
                //}

                //module.exports = {
                    //getPool,
                    //corsHeaders,
                    //handleError,
                    //sendResponse
                //};

// ADD in CORES in Azure Portal: ALLOWED_ORIGINS=https://lorcania11.github.io

const sql = require('mssql');

// Validate required environment variables
const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_SERVER', 'DB_NAME'];
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
    }
});

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

// Initialize connection pool with retry logic
async function getPool() {
    if (!pool || pool.connecting === false) {
        const maxRetries = 3;
        let retries = 0;
        
        while (retries < maxRetries) {
            try {
                console.log(`Initializing SQL connection pool... (attempt ${retries + 1})`);
                pool = await sql.connect(dbConfig);
                console.log('✅ Connected to Azure SQL Database successfully');
                return pool;
            } catch (error) {
                retries++;
                if (retries === maxRetries) {
                    console.error('❌ Failed to connect after all retries:', error);
                    throw error;
                }
                console.warn(`Connection attempt ${retries} failed, retrying in ${retries} seconds...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            }
        }
    }
    return pool;
}

// Clean up connections when needed
async function closePool() {
    if (pool) {
        try {
            await pool.close();
            pool = null;
            console.log('Database pool closed successfully');
        } catch (error) {
            console.error('Error closing database pool:', error);
        }
    }
}

// CORS headers for all responses
// In production, set ALLOWED_ORIGINS environment variable to your domain
const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true'
};

// Enhanced error handling
function handleError(context, error) {
    context.log.error('Database operation failed:', {
        message: error.message,
        code: error.code,
        state: error.state,
        timestamp: new Date().toISOString()
    });
    
    // More specific error messages based on error codes
    let clientError = 'Database operation failed';
    let statusCode = 500;
    
    if (error.code === 'ETIMEOUT') {
        clientError = 'Database connection timeout';
        statusCode = 504;
    } else if (error.code === 'ELOGIN') {
        clientError = 'Database authentication failed';
        statusCode = 503;
    } else if (error.code === 'EREQUEST') {
        clientError = 'Database request failed';
        statusCode = 503;
    } else if (error.message && error.message.includes('duplicate')) {
        clientError = 'Duplicate entry found';
        statusCode = 409;
    }
        
    context.res = {
        status: statusCode,
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
    closePool,
    corsHeaders,
    handleError,
    sendResponse
};