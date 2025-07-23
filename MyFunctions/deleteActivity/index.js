const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');
const sql = require('mssql');

module.exports = async function (context, req) {
    context.log('DELETE activity request received');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 204,
            headers: corsHeaders
        };
        return;
    }

    try {
        const activityId = context.bindingData.id;
        const pool = await getPool();
        
        context.log(`Deleting activity: ${activityId}`);
        
        const result = await pool.request()
            .input('ActivityId', sql.NVarChar(50), activityId)
            .query('DELETE FROM Activities WHERE Id = @ActivityId');

        if (result.rowsAffected[0] > 0) {
            context.log(`✅ Activity ${activityId} deleted successfully`);
            sendResponse(context, { success: true });
        } else {
            sendResponse(context, { error: 'Activity not found' }, 404);
        }
    } catch (error) {
        handleError(context, error);
    }
};