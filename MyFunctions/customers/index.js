const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');
const sql = require('mssql');

// Import the individual handlers
const getCustomers = require('../getCustomers/index.js');
const createCustomer = require('../createCustomer/index.js');
const updateCustomer = require('../updateCustomer/index.js');
const deleteCustomer = require('../deleteCustomer/index.js');

module.exports = async function (context, req) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 204,
            headers: corsHeaders
        };
        return;
    }

    // Route to appropriate handler based on HTTP method
    switch (req.method) {
        case 'GET':
            return getCustomers(context, req);
        case 'POST':
            return createCustomer(context, req);
        case 'PUT':
            if (context.bindingData.id) {
                return updateCustomer(context, req);
            } else {
                context.res = {
                    status: 400,
                    headers: corsHeaders,
                    body: { error: 'ID required for update' }
                };
            }
            break;
        case 'DELETE':
            if (context.bindingData.id) {
                return deleteCustomer(context, req);
            } else {
                context.res = {
                    status: 400,
                    headers: corsHeaders,
                    body: { error: 'ID required for delete' }
                };
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