const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');

// Import the individual handlers
const getQuotes = require('../getQuotes/index.js');
const createQuote = require('../createQuote/index.js');

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
            return getQuotes(context, req);
        case 'POST':
            return createQuote(context, req);
        default:
            context.res = {
                status: 405,
                headers: corsHeaders,
                body: { error: 'Method not allowed' }
            };
    }
};