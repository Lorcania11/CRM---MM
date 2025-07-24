const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');
const sql = require('mssql');

module.exports = async function (context, req) {
    context.log(`${req.method} opportunities request received`);

    if (req.method === 'OPTIONS') {
        context.res = { status: 204, headers: corsHeaders };
        return;
    }

    try {
        const pool = await getPool();
        const opportunityId = context.bindingData.id;

        switch (req.method) {
            case 'GET':
                const result = opportunityId
                    ? await pool.request()
                        .input('Id', sql.NVarChar(50), opportunityId)
                        .query('SELECT * FROM Opportunities WHERE Id = @Id')
                    : await pool.request()
                        .query('SELECT * FROM Opportunities ORDER BY UpdatedAt DESC');

                sendResponse(context, opportunityId ? result.recordset[0] : result.recordset);
                break;

            case 'POST':
                const opp = req.body;
                await pool.request()
                    .input('Id', sql.NVarChar(50), opp.id)
                    .input('CustomerId', sql.NVarChar(50), opp.customerId)
                    .input('Title', sql.NVarChar(255), opp.title)
                    .input('Notes', sql.NVarChar(sql.MAX), opp.notes)
                    .query(`
                        INSERT INTO Opportunities (Id, CustomerId, Title, Notes)
                        VALUES (@Id, @CustomerId, @Title, @Notes)
                    `);
                sendResponse(context, { success: true, id: opp.id }, 201);
                break;

            case 'PUT':
                if (!opportunityId) {
                    sendResponse(context, { error: 'Opportunity ID required' }, 400);
                    return;
                }
                // Add update logic here
                sendResponse(context, { success: false, message: 'Update not yet implemented' }, 501);
                break;

            default:
                sendResponse(context, { error: 'Method not allowed' }, 405);
        }
    } catch (error) {
        handleError(context, error);
    }
};
