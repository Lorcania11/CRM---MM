const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');

// Import the individual handlers
const getActivities = require('../getActivities/index.js');
const createActivity = require('../createActivity/index.js');
const updateActivity = require('../updateActivity/index.js');
const deleteActivity = require('../deleteActivity/index.js');

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
            return getActivities(context, req);
        case 'POST':
            return createActivity(context, req);
        case 'PUT':
            if (context.bindingData.id) {
                return updateActivity(context, req);
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
                return deleteActivity(context, req);
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