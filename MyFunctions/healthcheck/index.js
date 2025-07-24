const { getPool, sendResponse, corsHeaders } = require('../shared/db');

module.exports = async function (context, req) {
    context.log('Health check request received');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 204,
            headers: corsHeaders
        };
        return;
    }

    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT 1 as HealthCheck, GETDATE() as ServerTime');
        
        sendResponse(context, {
            status: 'healthy',
            database: 'connected',
            server: process.env.DB_SERVER,
            database_name: process.env.DB_NAME,
            user: process.env.DB_USER,
            timestamp: result.recordset[0].ServerTime
        });
    } catch (error) {
        context.log.error('Health check failed:', error);
        context.res = {
            status: 503,
            headers: corsHeaders,
            body: {
                status: 'unhealthy',
                error: 'Database connection failed',
                timestamp: new Date().toISOString()
            }
        };
    }
};