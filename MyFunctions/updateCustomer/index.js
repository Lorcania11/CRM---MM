const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');
const sql = require('mssql');

module.exports = async function (context, req) {
    context.log('PUT customer request received');

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
        const customer = req.body;
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        
        context.log(`Updating customer: ${customerId}`);
        
        await transaction.begin();
        
        try {
            // Update customer record
            await transaction.request()
                .input('Id', sql.NVarChar(50), customerId)
                .input('Name', sql.NVarChar(255), customer.name)
                .input('Industry', sql.NVarChar(100), customer.industry)
                .input('OfficeNumber', sql.NVarChar(50), customer.officeNumber)
                .input('Status', sql.NVarChar(50), customer.status)
                .input('PipelineStage', sql.NVarChar(50), customer.pipelineStage)
                .input('PreferredContact', sql.NVarChar(50), customer.preferredContact)
                .input('AccountNotes', sql.NVarChar(sql.MAX), customer.accountNotes)
                .input('Website', sql.NVarChar(500), customer.website)
                .input('LinkedIn', sql.NVarChar(500), customer.linkedIn)
                .query(`
                    UPDATE Customers SET 
                        Name = @Name, Industry = @Industry, OfficeNumber = @OfficeNumber,
                        Status = @Status, PipelineStage = @PipelineStage, 
                        PreferredContact = @PreferredContact, AccountNotes = @AccountNotes, 
                        Website = @Website, LinkedIn = @LinkedIn, UpdatedAt = GETUTCDATE()
                    WHERE Id = @Id
                `);

            // Delete existing contacts and products, then re-insert
            await transaction.request()
                .input('CustomerId', sql.NVarChar(50), customerId)
                .query('DELETE FROM CustomerContacts WHERE CustomerId = @CustomerId');
                
            await transaction.request()
                .input('CustomerId', sql.NVarChar(50), customerId)
                .query('DELETE FROM CustomerProducts WHERE CustomerId = @CustomerId');

            // Re-insert updated contacts
            if (customer.contacts && customer.contacts.length > 0) {
                for (let i = 0; i < customer.contacts.length; i++) {
                    const contact = customer.contacts[i];
                    await transaction.request()
                        .input('CustomerId', sql.NVarChar(50), customerId)
                        .input('Name', sql.NVarChar(255), contact.name)
                        .input('Email', sql.NVarChar(255), contact.email)
                        .input('Cell', sql.NVarChar(50), contact.cell)
                        .input('Title', sql.NVarChar(100), contact.title)
                        .input('IsPrimary', sql.Bit, i === 0)
                        .query(`
                            INSERT INTO CustomerContacts (CustomerId, Name, Email, Cell, Title, IsPrimary)
                            VALUES (@CustomerId, @Name, @Email, @Cell, @Title, @IsPrimary)
                        `);
                }
            }

            // Re-insert updated products
            if (customer.primaryProducts && customer.primaryProducts.length > 0) {
                for (const product of customer.primaryProducts) {
                    await transaction.request()
                        .input('CustomerId', sql.NVarChar(50), customerId)
                        .input('ProductName', sql.NVarChar(255), product)
                        .query(`
                            INSERT INTO CustomerProducts (CustomerId, ProductName)
                            VALUES (@CustomerId, @ProductName)
                        `);
                }
            }

            await transaction.commit();
            context.log(`✅ Customer ${customerId} updated successfully`);
            sendResponse(context, { success: true });
            
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        handleError(context, error);
    }
};