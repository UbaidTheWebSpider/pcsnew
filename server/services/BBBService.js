const axios = require('axios');
const crypto = require('crypto');
const xml2js = require('xml2js');

class BBBService {
    constructor() {
        this.baseURL = process.env.BBB_BASE_URL || 'http://test-install.blindsidenetworks.com/bigbluebutton/api';
        this.secret = process.env.BBB_SECRET_KEY || '8cd8ef52e8e101574e400365b55e11a6';
        this.callbackURL = process.env.BBB_CALLBACK_URL || 'http://localhost:5001/api/callbacks/bbb';
    }

    /**
     * Generate SHA-1 checksum for BBB API calls
     * @param {string} apiCall - The API method (e.g., 'create', 'join')
     * @param {string} queryParams - The query string parameters
     * @returns {string} - The generated checksum
     */
    generateChecksum(apiCall, queryParams) {
        const stringToHash = apiCall + queryParams + this.secret;
        return crypto.createHash('sha1').update(stringToHash).digest('hex');
    }

    /**
     * Parse XML response from BBB
     * @param {string} xml - XML response string
     * @returns {Promise<Object>} - Parsed JSON object
     */
    async parseResponse(xml) {
        const parser = new xml2js.Parser({ explicitArray: false });
        try {
            return await parser.parseStringPromise(xml);
        } catch (error) {
            throw new Error('Failed to parse BBB response');
        }
    }

    /**
     * Create a new meeting
     * @param {string} meetingID - Unique meeting ID
     * @param {string} name - Meeting name
     * @param {string} attendeePW - Password for attendees
     * @param {string} moderatorPW - Password for moderators
     * @returns {Promise<Object>} - Meeting creation result
     */
    async createMeeting(meetingID, name, attendeePW, moderatorPW) {
        const params = new URLSearchParams({
            meetingID,
            name,
            attendeePW,
            moderatorPW,
            record: false,
            autoStartRecording: false,
            allowStartStopRecording: false,
            // meta_endCallbackUrl: this.callbackURL // Optional: for webhooks
        });

        const queryParams = params.toString();
        const checksum = this.generateChecksum('create', queryParams);
        const url = `${this.baseURL}/create?${queryParams}&checksum=${checksum}`;

        try {
            const response = await axios.get(url);
            const data = await this.parseResponse(response.data);

            if (data.response.returncode === 'FAILED') {
                throw new Error(data.response.messageKey || 'Failed to create meeting');
            }

            return data.response;
        } catch (error) {
            console.error('BBB Create Meeting Error:', error.message);
            throw new Error('Could not create video consultation room');
        }
    }

    /**
     * Get Join URL for a user
     * @param {string} meetingID - Meeting ID
     * @param {string} name - User's display name
     * @param {string} password - User's password (attendee or moderator)
     * @returns {string} - The full join URL
     */
    getJoinUrl(meetingID, name, password) {
        const params = new URLSearchParams({
            meetingID,
            fullName: name,
            password,
            redirect: 'true'
        });

        const queryParams = params.toString();
        const checksum = this.generateChecksum('join', queryParams);
        return `${this.baseURL}/join?${queryParams}&checksum=${checksum}`;
    }

    /**
     * End a meeting
     * @param {string} meetingID - Meeting ID
     * @param {string} password - Moderator password
     * @returns {Promise<Object>} - End meeting result
     */
    async endMeeting(meetingID, password) {
        const params = new URLSearchParams({
            meetingID,
            password
        });

        const queryParams = params.toString();
        const checksum = this.generateChecksum('end', queryParams);
        const url = `${this.baseURL}/end?${queryParams}&checksum=${checksum}`;

        try {
            const response = await axios.get(url);
            const data = await this.parseResponse(response.data);
            return data.response;
        } catch (error) {
            console.error('BBB End Meeting Error:', error.message);
            // Don't throw here, just return null or error object, as meeting might already be ended
            return { returncode: 'FAILED', message: error.message };
        }
    }

    /**
     * Check if a meeting is running
     * @param {string} meetingID - Meeting ID
     * @returns {Promise<boolean>} - True if running
     */
    async isMeetingRunning(meetingID) {
        const params = new URLSearchParams({ meetingID });
        const queryParams = params.toString();
        const checksum = this.generateChecksum('isMeetingRunning', queryParams);
        const url = `${this.baseURL}/isMeetingRunning?${queryParams}&checksum=${checksum}`;

        try {
            const response = await axios.get(url);
            const data = await this.parseResponse(response.data);
            return data.response.running === 'true';
        } catch (error) {
            return false;
        }
    }
}

module.exports = new BBBService();
