const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');
const sql = require('mssql');

module.exports = async function (context, req) {
    context.log('POST opportunity request received');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 204,
            headers: corsHeaders
        };
        return;
    }

    try {
        const opportunity = req.body;
        const pool = await getPool();
        
        context.log(`Creating opportunity: ${opportunity.title}`);
        
        await pool.request()
            .input('Id', sql.NVarChar(50), opportunity.id)
            .input('CustomerId', sql.NVarChar(50), opportunity.customerId)
            .input('Title', sql.NVarChar(255), opportunity.title)
            .input('Value', sql.Decimal(18, 2), opportunity.value)
            .input('Stage', sql.NVarChar(50), opportunity.stage)
            .input('SalesRep', sql.NVarChar(100), opportunity.salesRep)
            .input('ExpectedClose', sql.Date, opportunity.expectedClose)
            .query(`
                INSERT INTO Opportunities (Id, CustomerId, Title, Value, Stage, SalesRep, ExpectedClose)
                VALUES (@Id, @CustomerId, @Title, @Value, @Stage, @SalesRep, @ExpectedClose)
            `);

        context.log(`✅ Opportunity ${opportunity.title} created successfully`);
        sendResponse(context, { success: true, id: opportunity.id }, 201);
    } catch (error) {
        handleError(context, error);
    }
};