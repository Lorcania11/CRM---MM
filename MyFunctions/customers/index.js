const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');
const sql = require('mssql');

module.exports = async function (context, req) {
    context.log(`${req.method} customers request received`);

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
        const customerId = context.bindingData.id;

        switch (req.method) {
            case 'GET':
                if (customerId) {
                    // Get single customer
                    const result = await pool.request()
                        .input('CustomerId', sql.NVarChar(50), customerId)
                        .query('SELECT * FROM Customers WHERE Id = @CustomerId');

                    if (result.recordset.length > 0) {
                        sendResponse(context, result.recordset[0]);
                    } else {
                        sendResponse(context, { error: 'Customer not found' }, 404);
                    }
                } else {
                    // Get all customers
                    const customersResult = await pool.request().query(`
                        SELECT 
                            c.Id, c.Name, c.Industry, c.OfficeNumber, c.Status, c.PipelineStage, 
                            c.PreferredContact, c.AccountNotes, c.Website, c.LinkedIn, 
                            c.CreatedAt, c.UpdatedAt,
                            STRING_AGG(
                                CONCAT(
                                    ISNULL(cc.Name, ''), '|',
                                    ISNULL(cc.Email, ''), '|', 
                                    ISNULL(cc.Cell, ''), '|',
                                    ISNULL(cc.Title, ''), '|',
                                    CAST(cc.IsPrimary as VARCHAR)
                                ), ';'
                            ) WITHIN GROUP (ORDER BY cc.IsPrimary DESC, cc.Name) as ContactsData,
                            STRING_AGG(cp.ProductName, ';') WITHIN GROUP (ORDER BY cp.ProductName) as ProductsData
                        FROM Customers c
                        LEFT JOIN CustomerContacts cc ON c.Id = cc.CustomerId
                        LEFT JOIN CustomerProducts cp ON c.Id = cp.CustomerId
                        GROUP BY 
                            c.Id, c.Name, c.Industry, c.OfficeNumber, c.Status, c.PipelineStage, 
                            c.PreferredContact, c.AccountNotes, c.Website, c.LinkedIn, 
                            c.CreatedAt, c.UpdatedAt
                        ORDER BY c.UpdatedAt DESC
                    `);

                    const customers = customersResult.recordset.map(customer => ({
                        id: customer.Id,
                        name: customer.Name,
                        industry: customer.Industry,
                        officeNumber: customer.OfficeNumber,
                        status: customer.Status,
                        pipelineStage: customer.PipelineStage,
                        preferredContact: customer.PreferredContact,
                        accountNotes: customer.AccountNotes,
                        website: customer.Website,
                        linkedIn: customer.LinkedIn,
                        contacts: customer.ContactsData ?
                            customer.ContactsData.split(';')
                                .filter(contactStr => contactStr && contactStr.trim())
                                .map(contactStr => {
                                    const [name, email, cell, title, isPrimary] = contactStr.split('|');
                                    return {
                                        name: name || '',
                                        email: email || '',
                                        cell: cell || '',
                                        title: title || '',
                                        isPrimary: isPrimary === 'True' || isPrimary === '1'
                                    };
                                }) : [],
                        primaryProducts: customer.ProductsData ?
                            customer.ProductsData.split(';').filter(p => p && p.trim()) : [],
                        createdAt: customer.CreatedAt,
                        updatedAt: customer.UpdatedAt,
                        contact: customer.ContactsData ?
                            customer.ContactsData.split(';')[0]?.split('|')[0] || '' : '',
                        email: customer.ContactsData ?
                            customer.ContactsData.split(';')[0]?.split('|')[1] || '' : '',
                        phone: customer.ContactsData ?
                            customer.ContactsData.split(';')[0]?.split('|')[2] || '' : ''
                    }));

                    sendResponse(context, customers);
                }
                break;

            case 'POST':
                // Create customer logic from createCustomer/index.js
                const customer = req.body;
                const transaction = new sql.Transaction(pool);

                await transaction.begin();

                try {
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

                    if (customer.contacts && customer.contacts.length > 0) {
                        for (let i = 0; i < customer.contacts.length; i++) {
                            const contact = customer.contacts[i];
                            await transaction.request()
                                .input('CustomerId', sql.NVarChar(50), customer.id)
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
                    sendResponse(context, { success: true, id: customer.id }, 201);

                } catch (error) {
                    await transaction.rollback();
                    throw error;
                }
                break;

            case 'PUT':
                // Update customer logic
                if (!customerId) {
                    sendResponse(context, { error: 'Customer ID required' }, 400);
                    return;
                }
                // Add update logic here (copy from updateCustomer/index.js)
                break;

            case 'DELETE':
                // Delete customer logic
                if (!customerId) {
                    sendResponse(context, { error: 'Customer ID required' }, 400);
                    return;
                }

                const deleteResult = await pool.request()
                    .input('CustomerId', sql.NVarChar(50), customerId)
                    .query('DELETE FROM Customers WHERE Id = @CustomerId');

                if (deleteResult.rowsAffected[0] > 0) {
                    sendResponse(context, { success: true });
                } else {
                    sendResponse(context, { error: 'Customer not found' }, 404);
                }
                break;

            default:
                sendResponse(context, { error: 'Method not allowed' }, 405);
        }
    } catch (error) {
        handleError(context, error);
    }
};
