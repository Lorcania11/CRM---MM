const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');
const sql = require('mssql');

module.exports = async function (context, req) {
    context.log('POST customer request received');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 204,
            headers: corsHeaders
        };
        return;
    }

    try {
        const customer = req.body;
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        
        context.log(`Creating customer: ${customer.name}`);
        
        await transaction.begin();
        
        try {
            // Insert customer record
            await transaction.request()
                .input('Id', sql.NVarChar(50), customer.id)
                .input('Name', sql.NVarChar(255), customer.name)
                .input('Industry', sql.NVarChar(100), customer.industry)
                .input('OfficeNumber', sql.NVarChar(50), customer.officeNumber)
                .input('Status', sql.NVarChar(50), customer.status || 'prospect')
                .input('PipelineStage', sql.NVarChar(50), customer.pipelineStage || 'lead')
                .input('PreferredContact', sql.NVarChar(50), customer.preferredContact)
                .input('AccountNotes', sql.NVarChar(sql.MAX), customer.accountNotes)
                .input('Website', sql.NVarChar(500), customer.website)
                .input('LinkedIn', sql.NVarChar(500), customer.linkedIn)
                .query(`
                    INSERT INTO Customers (
                        Id, Name, Industry, OfficeNumber, Status, PipelineStage, 
                        PreferredContact, AccountNotes, Website, LinkedIn
                    )
                    VALUES (
                        @Id, @Name, @Industry, @OfficeNumber, @Status, @PipelineStage, 
                        @PreferredContact, @AccountNotes, @Website, @LinkedIn
                    )
                `);

            // Insert customer contacts
            if (customer.contacts && customer.contacts.length > 0) {
                for (let i = 0; i < customer.contacts.length; i++) {
                    const contact = customer.contacts[i];
                    await transaction.request()
                        .input('CustomerId', sql.NVarChar(50), customer.id)
                        .input('Name', sql.NVarChar(255), contact.name)
                        .input('Email', sql.NVarChar(255), contact.email)
                        .input('Cell', sql.NVarChar(50), contact.cell)
                        .input('Title', sql.NVarChar(100), contact.title)
                        .input('IsPrimary', sql.Bit, i === 0) // First contact is primary
                        .query(`
                            INSERT INTO CustomerContacts (CustomerId, Name, Email, Cell, Title, IsPrimary)
                            VALUES (@CustomerId, @Name, @Email, @Cell, @Title, @IsPrimary)
                        `);
                }
            }

            // Insert customer products of interest
            if (customer.primaryProducts && customer.primaryProducts.length > 0) {
                for (const product of customer.primaryProducts) {
                    await transaction.request()
                        .input('CustomerId', sql.NVarChar(50), customer.id)
                        .input('ProductName', sql.NVarChar(255), product)
                        .query(`
                            INSERT INTO CustomerProducts (CustomerId, ProductName)
                            VALUES (@CustomerId, @ProductName)
                        `);
                }
            }

            await transaction.commit();
            context.log(`✅ Customer ${customer.name} created successfully`);
            sendResponse(context, { success: true, id: customer.id }, 201);
            
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        handleError(context, error);
    }
};