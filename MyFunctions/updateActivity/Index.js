const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');
const sql = require('mssql');

module.exports = async function (context, req) {
    context.log('PUT activity request received');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 204,
            headers: corsHeaders
        };
        return;
    }

    try {
        const activityId = context.bindingData.id;
        const activity = req.body;
        const pool = await getPool();
        
        context.log(`Updating activity: ${activityId}`);
        
        await pool.request()
            .input('Id', sql.NVarChar(50), activityId)
            .input('Subject', sql.NVarChar(255), activity.subject)
            .input('Date', sql.Date, activity.date)
            .input('Time', sql.NVarChar(20), activity.time)
            .input('Notes', sql.NVarChar(sql.MAX), activity.notes)
            .input('Completed', sql.Bit, activity.completed)
            .input('CompletedDate', sql.DateTime2, activity.completedDate)
            .input('FollowUpCreated', sql.Bit, activity.followUpCreated)
            .input('GoogleCalendarId', sql.NVarChar(255), activity.googleCalendarId)
            .input('GoogleCalendarLink', sql.NVarChar(500), activity.googleCalendarLink)
            .query(`
                UPDATE Activities SET 
                    Subject = @Subject, Date = @Date, Time = @Time, Notes = @Notes,
                    Completed = @Completed, CompletedDate = @CompletedDate, 
                    FollowUpCreated = @FollowUpCreated, GoogleCalendarId = @GoogleCalendarId,
                    GoogleCalendarLink = @GoogleCalendarLink, UpdatedAt = GETUTCDATE()
                WHERE Id = @Id
            `);

        context.log(`✅ Activity ${activityId} updated successfully`);
        sendResponse(context, { success: true });
    } catch (error) {
        handleError(context, error);
    }
};