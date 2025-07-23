const { getPool, sendResponse, handleError, corsHeaders } = require('../shared/db');
const sql = require('mssql');

module.exports = async function (context, req) {
    context.log('POST activity request received');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 204,
            headers: corsHeaders
        };
        return;
    }

    try {
        const activity = req.body;
        const pool = await getPool();
        
        context.log(`Creating activity: ${activity.subject}`);
        
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

        context.log(`✅ Activity ${activity.subject} created successfully`);
        sendResponse(context, { success: true, id: activity.id }, 201);
    } catch (error) {
        handleError(context, error);
    }
};