// MyFunctions/opportunities/index.js
const { getOpportunities, createOpportunity } = require('../azure_functions_api');

module.exports = async function (context, req) {
    context.log('Opportunities function processed a request.');
    
    if (req.method === 'GET') {
        return await getOpportunities(context, req);
    } else if (req.method === 'POST') {
        return await createOpportunity(context, req);
    }
};