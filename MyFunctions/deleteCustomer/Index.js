const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');
const sql = require('mssql');

module.exports = async function (context, req) {
    context.log('DELETE customer request received');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 204,
            headers: corsHeaders
        };
        return;
    }

    try {
        const customerId = context.bindingData.id;
        const pool = await getPool();
        
        context.log(`Deleting customer: ${customerId}`);
        
        // Delete customer (cascading deletes will handle related records)
        const result = await pool.request()
            .input('CustomerId', sql.NVarChar(50), customerId)
            .query('DELETE FROM Customers WHERE Id = @CustomerId');

        if (result.rowsAffected[0] > 0) {
            context.log(`✅ Customer ${customerId} deleted successfully`);
            sendResponse(context, { success: true });
        } else {
            sendResponse(context, { error: 'Customer not found' }, 404);
        }
    } catch (error) {
        handleError(context, error);
    }
};