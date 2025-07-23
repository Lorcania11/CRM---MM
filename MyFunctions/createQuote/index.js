const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');
const sql = require('mssql');

module.exports = async function (context, req) {
    context.log('POST quote request received');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 204,
            headers: corsHeaders
        };
        return;
    }

    try {
        const quote = req.body;
        const pool = await getPool();
        
        context.log(`Creating quote: ${quote.quoteName}`);
        
        await pool.request()
            .input('Id', sql.NVarChar(50), quote.id)
            .input('CustomerId', sql.NVarChar(50), quote.customerId)
            .input('QuoteNumber', sql.NVarChar(100), quote.quoteNumber)
            .input('QuoteName', sql.NVarChar(255), quote.quoteName)
            .input('Status', sql.NVarChar(50), quote.status)
            .query(`
                INSERT INTO Quotes (Id, CustomerId, QuoteNumber, QuoteName, Status)
                VALUES (@Id, @CustomerId, @QuoteNumber, @QuoteName, @Status)
            `);

        context.log(`✅ Quote ${quote.quoteName} created successfully`);
        sendResponse(context, { success: true, id: quote.id }, 201);
    } catch (error) {
        handleError(context, error);
    }
};