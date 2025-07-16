const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');
const sql = require('mssql');

module.exports = async function (context, req) {
    context.log('PUT opportunity request received');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 204,
            headers: corsHeaders
        };
        return;
    }

    try {
        const opportunityId = context.bindingData.id;
        const opportunity = req.body;
        const pool = await getPool();
        
        context.log(`Updating opportunity: ${opportunityId}`);
        
        await pool.request()
            .input('Id', sql.NVarChar(50), opportunityId)
            .input('Title', sql.NVarChar(255), opportunity.title)
            .input('Value', sql.Decimal(18, 2), opportunity.value)
            .input('Stage', sql.NVarChar(50), opportunity.stage)
            .input('SalesRep', sql.NVarChar(100), opportunity.salesRep)
            .input('ExpectedClose', sql.Date, opportunity.expectedClose)
            .query(`
                UPDATE Opportunities SET 
                    Title = @Title, Value = @Value, Stage = @Stage, 
                    SalesRep = @SalesRep, ExpectedClose = @ExpectedClose,
                    UpdatedAt = GETUTCDATE()
                WHERE Id = @Id
            `);

        context.log(`✅ Opportunity ${opportunityId} updated successfully`);
        sendResponse(context, { success: true });
    } catch (error) {
        handleError(context, error);
    }
};