const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');

module.exports = async function (context, req) {
    context.log('GET dashboard metrics request received');

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
        const result = await pool.request().execute('sp_GetDashboardMetrics');
        
        const metrics = result.recordset[0];
        
        context.log('✅ Dashboard metrics retrieved successfully');
        sendResponse(context, {
            openOpportunities: metrics.OpenOpportunities,
            totalPipeline: metrics.TotalPipeline,
            wonDeals: metrics.WonDeals,
            activeCustomers: metrics.ActiveCustomers,
            winRate: metrics.WinRate
        });
    } catch (error) {
        handleError(context, error);
    }
};