const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');
const sql = require('mssql');

module.exports = async function (context, req) {
    context.log(`${req.method} activities request received`);

    if (req.method === 'OPTIONS') {
        context.res = {
            status: 204,
            headers: corsHeaders
        };
        return;
    }

    try {
        const pool = await getPool();
        const activityId = context.bindingData.id;

        switch (req.method) {
            case 'GET':
                // Get activities logic
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
                    audioRecording: activity.AudioRecordingUrl ? {
                        url: activity.AudioRecordingUrl,
                        duration: activity.AudioDuration,
                        mimeType: activity.AudioMimeType
                    } : null,
                    googleCalendarId: activity.GoogleCalendarId,
                    googleCalendarLink: activity.GoogleCalendarLink,
                    createdAt: activity.CreatedAt,
                    updatedAt: activity.UpdatedAt,
                    customerName: activity.CustomerName,
                    customerStatus: activity.CustomerStatus,
                    opportunityTitle: activity.OpportunityTitle
                }));

                sendResponse(context, activities);
                break;

            case 'POST':
                // Create activity logic
                const activity = req.body;
                await pool.request()
                    .input('Id', sql.NVarChar(50), activity.id)
                    .input('CustomerId', sql.NVarChar(50), activity.customerId)
                    .input('OpportunityId', sql.NVarChar(50), activity.opportunityId)
                    .input('Type', sql.NVarChar(50), activity.type)
                    .input('Subject', sql.NVarChar(255), activity.subject)
                    .input('Date', sql.Date, activity.date)
                    .input('Time', sql.NVarChar(20), activity.time)
                    .input('Notes', sql.NVarChar(sql.MAX), activity.notes)
                    .input('PipelineStage', sql.NVarChar(50), activity.pipelineStage)
                    .input('AudioRecordingUrl', sql.NVarChar(500), activity.audioRecording?.url)
                    .input('AudioDuration', sql.Int, activity.audioRecording?.duration)
                    .input('AudioMimeType', sql.NVarChar(100), activity.audioRecording?.mimeType)
                    .query(`
                        INSERT INTO Activities (
                            Id, CustomerId, OpportunityId, Type, Subject, Date, Time, 
                            Notes, PipelineStage, AudioRecordingUrl, AudioDuration, AudioMimeType
                        )
                        VALUES (
                            @Id, @CustomerId, @OpportunityId, @Type, @Subject, @Date, @Time, 
                            @Notes, @PipelineStage, @AudioRecordingUrl, @AudioDuration, @AudioMimeType
                        )
                    `);

                sendResponse(context, { success: true, id: activity.id }, 201);
                break;

            case 'PUT':
                // Update activity logic
                if (!activityId) {
                    sendResponse(context, { error: 'Activity ID required' }, 400);
                    return;
                }
                // Add update logic here
                break;

            case 'DELETE':
                // Delete activity logic
                if (!activityId) {
                    sendResponse(context, { error: 'Activity ID required' }, 400);
                    return;
                }

                const deleteResult = await pool.request()
                    .input('ActivityId', sql.NVarChar(50), activityId)
                    .query('DELETE FROM Activities WHERE Id = @ActivityId');

                if (deleteResult.rowsAffected[0] > 0) {
                    sendResponse(context, { success: true });
                } else {
                    sendResponse(context, { error: 'Activity not found' }, 404);
                }
                break;

            default:
                sendResponse(context, { error: 'Method not allowed' }, 405);
        }
    } catch (error) {
        handleError(context, error);
    }
};
