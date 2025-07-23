const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');

module.exports = async function (context, req) {
    context.log('GET quotes request received');

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
            SELECT q.*, c.Name as CustomerName
            FROM Quotes q
            INNER JOIN Customers c ON q.CustomerId = c.Id
            ORDER BY q.CreatedAt DESC
        `);

        const quotes = result.recordset.map(quote => ({
            id: quote.Id,
            customerId: quote.CustomerId,
            quoteNumber: quote.QuoteNumber,
            quoteName: quote.QuoteName,
            status: quote.Status,
            createdAt: quote.CreatedAt,
            updatedAt: quote.UpdatedAt,
            customerName: quote.CustomerName
        }));

        context.log(`✅ Retrieved ${quotes.length} quotes`);
        sendResponse(context, quotes);
    } catch (error) {
        handleError(context, error);
    }
};