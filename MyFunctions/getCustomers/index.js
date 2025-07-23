const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');

module.exports = async function (context, req) {
    context.log('GET customers request received');

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
        
        // Enhanced query to get customers with all related data
        const customersResult = await pool.request().query(`
            SELECT 
                c.Id, c.Name, c.Industry, c.OfficeNumber, c.Status, c.PipelineStage, 
                c.PreferredContact, c.AccountNotes, c.Website, c.LinkedIn, 
                c.CreatedAt, c.UpdatedAt,
                -- Aggregate contacts data
                STRING_AGG(
                    CONCAT(
                        ISNULL(cc.Name, ''), '|',
                        ISNULL(cc.Email, ''), '|', 
                        ISNULL(cc.Cell, ''), '|',
                        ISNULL(cc.Title, ''), '|',
                        CAST(cc.IsPrimary as VARCHAR)
                    ), ';'
                ) WITHIN GROUP (ORDER BY cc.IsPrimary DESC, cc.Name) as ContactsData,
                -- Aggregate products data
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

        // Transform the data to match CRM frontend format
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
            // Parse contacts data
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
            // Parse products data
            primaryProducts: customer.ProductsData ? 
                customer.ProductsData.split(';').filter(p => p && p.trim()) : [],
            createdAt: customer.CreatedAt,
            updatedAt: customer.UpdatedAt,
            // Legacy fields for backward compatibility
            contact: customer.ContactsData ? 
                customer.ContactsData.split(';')[0]?.split('|')[0] || '' : '',
            email: customer.ContactsData ? 
                customer.ContactsData.split(';')[0]?.split('|')[1] || '' : '',
            phone: customer.ContactsData ? 
                customer.ContactsData.split(';')[0]?.split('|')[2] || '' : ''
        }));

        context.log(`✅ Retrieved ${customers.length} customers successfully`);
        sendResponse(context, customers);
    } catch (error) {
        handleError(context, error);
    }
};