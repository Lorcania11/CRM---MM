# Major Metals CRM - Azure Functions Backend

## Overview
This is the Azure Functions backend for the Major Metals CRM system. It provides RESTful APIs that connect to an Azure SQL Database.

## File Structure
```
MyFunctions/
├── host.json                      # Azure Functions host configuration
├── local.settings.json            # Local development settings (DO NOT COMMIT)
├── package.json                   # Node.js dependencies
├── shared/
│   └── db.js                      # Shared database connection module
├── healthCheck/                   # Health check endpoint
│   ├── index.js
│   └── function.json
├── getCustomers/                  # GET /api/customers
│   ├── index.js
│   └── function.json
├── createCustomer/                # POST /api/customers
│   ├── index.js
│   └── function.json
├── updateCustomer/                # PUT /api/customers/{id}
│   ├── index.js
│   └── function.json
├── deleteCustomer/                # DELETE /api/customers/{id}
│   ├── index.js
│   └── function.json
├── getOpportunities/              # GET /api/opportunities
│   ├── index.js
│   └── function.json
├── createOpportunity/             # POST /api/opportunities
│   ├── index.js
│   └── function.json
├── updateOpportunity/             # PUT /api/opportunities/{id}
│   ├── index.js
│   └── function.json
├── getActivities/                 # GET /api/activities
│   ├── index.js
│   └── function.json
├── createActivity/                # POST /api/activities
│   ├── index.js
│   └── function.json
├── updateActivity/                # PUT /api/activities/{id}
│   ├── index.js
│   └── function.json
├── deleteActivity/                # DELETE /api/activities/{id}
│   ├── index.js
│   └── function.json
├── getQuotes/                     # GET /api/quotes
│   ├── index.js
│   └── function.json
├── createQuote/                   # POST /api/quotes
│   ├── index.js
│   └── function.json
└── getDashboardMetrics/           # GET /api/dashboard/metrics
    ├── index.js
    └── function.json
```

## Prerequisites
1. Azure CLI installed
2. Azure Functions Core Tools v4 installed
3. Node.js 18 or higher
4. Azure subscription with:
   - Azure SQL Database (already created)
   - Azure Function App (to be created)

## Local Development Setup

1. **Install dependencies:**
   ```bash
   cd MyFunctions
   npm install
   ```

2. **Update local.settings.json:**
   - The file already contains your database credentials
   - **IMPORTANT:** Never commit this file to source control

3. **Run locally:**
   ```bash
   func start
   ```
   The functions will be available at `http://localhost:7071/api/`

## Deployment to Azure

1. **Create an Azure Function App:**
   ```bash
   # Variables
   RESOURCE_GROUP="rg-majormetals-crm"
   FUNCTION_APP="func-majormetals-crm"
   STORAGE_ACCOUNT="stmajormetalscrm"
   LOCATION="eastus"

   # Create resource group
   az group create --name $RESOURCE_GROUP --location $LOCATION

   # Create storage account
   az storage account create \
     --name $STORAGE_ACCOUNT \
     --location $LOCATION \
     --resource-group $RESOURCE_GROUP \
     --sku Standard_LRS

   # Create function app
   az functionapp create \
     --resource-group $RESOURCE_GROUP \
     --consumption-plan-location $LOCATION \
     --runtime node \
     --runtime-version 18 \
     --functions-version 4 \
     --name $FUNCTION_APP \
     --storage-account $STORAGE_ACCOUNT
   ```

2. **Configure app settings:**
   ```bash
   # Set database connection settings
   az functionapp config appsettings set \
     --name $FUNCTION_APP \
     --resource-group $RESOURCE_GROUP \
     --settings \
       "DB_USER=CRM" \
       "DB_PASSWORD=hnjg809347q50chngsad.,@*FGG##ssd1123" \
       "DB_SERVER=sql-majormetals-crm.database.windows.net" \
       "DB_NAME=MajorMetalsCRM"
   ```

3. **Deploy the functions:**
   ```bash
   # From the MyFunctions directory
   func azure functionapp publish $FUNCTION_APP
   ```

## API Endpoints

Once deployed, your API endpoints will be available at:
```
https://func-majormetals-crm.azurewebsites.net/api/
```

### Available Endpoints:
- **Health Check:** GET `/api/health`
- **Customers:**
  - GET `/api/customers` - Get all customers
  - POST `/api/customers` - Create customer
  - PUT `/api/customers/{id}` - Update customer
  - DELETE `/api/customers/{id}` - Delete customer
- **Opportunities:**
  - GET `/api/opportunities` - Get all opportunities
  - POST `/api/opportunities` - Create opportunity
  - PUT `/api/opportunities/{id}` - Update opportunity
- **Activities:**
  - GET `/api/activities` - Get all activities
  - POST `/api/activities` - Create activity
  - PUT `/api/activities/{id}` - Update activity
  - DELETE `/api/activities/{id}` - Delete activity
- **Quotes:**
  - GET `/api/quotes` - Get all quotes
  - POST `/api/quotes` - Create quote
- **Dashboard:**
  - GET `/api/dashboard/metrics` - Get dashboard metrics

## Frontend Configuration

Update your frontend `index.html` to point to the deployed Azure Functions:
```javascript
this.AZURE_API_BASE = 'https://func-majormetals-crm.azurewebsites.net/api';
```

## Security Notes

1. **Database Credentials:**
   - Never commit `local.settings.json` to source control
   - Use Azure Key Vault for production deployments
   - Consider using Managed Identity for database connections

2. **CORS:**
   - Currently set to allow all origins (`*`)
   - For production, update to specific allowed origins

3. **Authentication:**
   - Currently using anonymous auth level
   - Consider implementing Azure AD authentication for production

## Monitoring

View function logs in Azure Portal:
1. Go to your Function App
2. Navigate to "Functions" → Select a function → "Monitor"
3. View logs in "Application Insights"

## Troubleshooting

1. **Connection errors:**
   - Verify database credentials
   - Check firewall rules on Azure SQL Database
   - Ensure Function App can reach the database

2. **CORS errors:**
   - Check CORS settings in host.json
   - Verify OPTIONS preflight handling

3. **Performance issues:**
   - Monitor database connection pool
   - Check Function App scaling settings
   - Review Application Insights for bottlenecks