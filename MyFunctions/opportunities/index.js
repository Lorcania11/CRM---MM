const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');
const sql = require('mssql');

module.exports = async function (context, req) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 204,
            headers: corsHeaders
        };
        return;
    }

    const pool = await getPool();

    switch (req.method) {
        case 'GET':
            // Get all opportunities
            try {
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

                sendResponse(context, opportunities);
            } catch (error) {
                handleError(context, error);
            }
            break;

        case 'POST':
            // Create opportunity
            try {
                const opportunity = req.body;
                
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

                sendResponse(context, { success: true, id: opportunity.id }, 201);
            } catch (error) {
                handleError(context, error);
            }
            break;

        case 'PUT':
            // Update opportunity
            if (!context.bindingData.id) {
                context.res = {
                    status: 400,
                    headers: corsHeaders,
                    body: { error: 'ID required for update' }
                };
                return;
            }

            try {
                const opportunityId = context.bindingData.id;
                const opportunity = req.body;
                
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

                sendResponse(context, { success: true });
            } catch (error) {
                handleError(context, error);
            }
            break;

        default:
            context.res = {
                status: 405,
                headers: corsHeaders,
                body: { error: 'Method not allowed' }
            };
    }
};