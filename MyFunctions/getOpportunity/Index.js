const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');

module.exports = async function (context, req) {
    context.log('GET opportunities request received');

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
        const result = await pool.request().query(`
            SELECT * FROM Opportunities ORDER BY UpdatedAt DESC
        `);

        const opportunities = result.recordset.map(opp => ({
            id: opp.Id,
            customerId: opp.CustomerId,
            title: opp.Title,
            value: opp.Value,
            stage: opp.Stage,
            salesRep: opp.SalesRep,
            expectedClose: opp.ExpectedClose,
            createdAt: opp.CreatedAt,
            updatedAt: opp.UpdatedAt
        }));

        context.log(`✅ Retrieved ${opportunities.length} opportunities`);
        sendResponse(context, opportunities);
    } catch (error) {
        handleError(context, error);
    }
};