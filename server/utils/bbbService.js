const axios = require('axios');
const crypto = require('crypto');
const xml2js = require('xml2js');

// BigBlueButton Configuration
const BBB_URL = process.env.BBB_URL || 'https://test-install.blindsidenetworks.com/bigbluebutton/api';
const BBB_SECRET = process.env.BBB_SECRET || '8cd8ef52e8e101574e400365b55e11a6'; // Default test secret

/**
 * Helper to generate checksum for BBB API calls
 */
const generateChecksum = (apiCall, queryParams) => {
    return crypto.createHash('sha1').update(apiCall + queryParams + BBB_SECRET).digest('hex');
};

/**
 * Create a meeting room
 * @param {string} meetingID - Unique meeting ID
 * @param {string} meetingName - Name of the meeting
 * @param {string} attendeePW - Password for attendees
 * @param {string} moderatorPW - Password for moderators
 */
const createMeeting = async (meetingID, meetingName, attendeePW = 'ap', moderatorPW = 'mp') => {
    try {
        const apiCall = 'create';
        const queryParams = `name=${encodeURIComponent(meetingName)}&meetingID=${meetingID}&attendeePW=${attendeePW}&moderatorPW=${moderatorPW}&record=true`;
        const checksum = generateChecksum(apiCall, queryParams);
        const url = `${BBB_URL}/${apiCall}?${queryParams}&checksum=${checksum}`;

        const response = await axios.get(url);
        const result = await xml2js.parseStringPromise(response.data);

        if (result.response.returncode[0] === 'SUCCESS') {
            return {
                success: true,
                meetingID: result.response.meetingID[0],
                attendeePW: result.response.attendeePW[0],
                moderatorPW: result.response.moderatorPW[0],
                createDate: result.response.createDate[0]
            };
        } else {
            throw new Error(result.response.messageKey[0] || 'Failed to create meeting');
        }
    } catch (error) {
        console.error('BBB Create Meeting Error:', error.message);
        throw error;
    }
};

/**
 * Get Join URL for a user
 * @param {string} meetingID - Meeting ID to join
 * @param {string} fullName - User's full name
 * @param {string} password - Password (attendee or moderator)
 */
const getJoinUrl = (meetingID, fullName, password) => {
    const apiCall = 'join';
    const queryParams = `fullName=${encodeURIComponent(fullName)}&meetingID=${meetingID}&password=${password}`;
    const checksum = generateChecksum(apiCall, queryParams);
    return `${BBB_URL}/${apiCall}?${queryParams}&checksum=${checksum}`;
};

/**
 * Check if a meeting is running
 * @param {string} meetingID 
 */
const isMeetingRunning = async (meetingID) => {
    try {
        const apiCall = 'isMeetingRunning';
        const queryParams = `meetingID=${meetingID}`;
        const checksum = generateChecksum(apiCall, queryParams);
        const url = `${BBB_URL}/${apiCall}?${queryParams}&checksum=${checksum}`;

        const response = await axios.get(url);
        const result = await xml2js.parseStringPromise(response.data);

        return result.response.running[0] === 'true';
    } catch (error) {
        console.error('BBB Check Meeting Error:', error.message);
        return false;
    }
};

module.exports = {
    createMeeting,
    getJoinUrl,
    isMeetingRunning
};
