const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');
const sql = require('mssql');

module.exports = async function (context, req) {
    context.log(`${req.method} quotes request received`);

    if (req.method === 'OPTIONS') {
        context.res = { status: 204, headers: corsHeaders };
        return;
    }

    try {
        const pool = await getPool();
        const quoteId = context.bindingData.id;

        switch (req.method) {
            case 'GET':
                const result = quoteId
                    ? await pool.request()
                        .input('Id', sql.NVarChar(50), quoteId)
                        .query('SELECT * FROM Quotes WHERE Id = @Id')
                    : await pool.request()
                        .query('SELECT * FROM Quotes ORDER BY UpdatedAt DESC');

                sendResponse(context, quoteId ? result.recordset[0] : result.recordset);
                break;

            case 'POST':
                const quote = req.body;
                await pool.request()
                    .input('Id', sql.NVarChar(50), quote.id)
                    .input('CustomerId', sql.NVarChar(50), quote.customerId)
                    .input('Amount', sql.Money, quote.amount)
                    .input('Details', sql.NVarChar(sql.MAX), quote.details)
                    .query(`
                        INSERT INTO Quotes (Id, CustomerId, Amount, Details)
                        VALUES (@Id, @CustomerId, @Amount, @Details)
                    `);
                sendResponse(context, { success: true, id: quote.id }, 201);
                break;

            default:
                sendResponse(context, { error: 'Method not allowed' }, 405);
        }
    } catch (error) {
        handleError(context, error);
    }
};
