const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');

module.exports = async function (context, req) {
    context.log('GET activities request received');

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
        const result = await pool.request().query(`
            SELECT 
                a.*,
                c.Name as CustomerName,
                c.Status as CustomerStatus,
                o.Title as OpportunityTitle
            FROM Activities a
            INNER JOIN Customers c ON a.CustomerId = c.Id
            LEFT JOIN Opportunities o ON a.OpportunityId = o.Id
            ORDER BY a.Date DESC, a.Time ASC
        `);

        const activities = result.recordset.map(activity => ({
            id: activity.Id,
            customerId: activity.CustomerId,
            opportunityId: activity.OpportunityId,
            type: activity.Type,
            subject: activity.Subject,
            date: activity.Date,
            time: activity.Time,
            notes: activity.Notes,
            completed: activity.Completed,
            completedDate: activity.CompletedDate,
            followUpCreated: activity.FollowUpCreated,
            pipelineStage: activity.PipelineStage,
            // Audio recording data
            audioRecording: activity.AudioRecordingUrl ? {
                url: activity.AudioRecordingUrl,
                duration: activity.AudioDuration,
                mimeType: activity.AudioMimeType
            } : null,
            // Google Calendar integration
            googleCalendarId: activity.GoogleCalendarId,
            googleCalendarLink: activity.GoogleCalendarLink,
            createdAt: activity.CreatedAt,
            updatedAt: activity.UpdatedAt,
            // Additional data for frontend
            customerName: activity.CustomerName,
            customerStatus: activity.CustomerStatus,
            opportunityTitle: activity.OpportunityTitle
        }));

        context.log(`✅ Retrieved ${activities.length} activities`);
        sendResponse(context, activities);
    } catch (error) {
        handleError(context, error);
    }
};